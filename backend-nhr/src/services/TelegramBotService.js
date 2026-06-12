import { startOfDay, endOfDay, format } from 'date-fns';
import BookingService from './BookingService.js';
import SchedulingService from './SchedulingService.js';
import AuditService from './AuditService.js';
import logger from '../utils/logger.js';
import bcrypt from 'bcryptjs';

const userStates = {};

function getState(chatId) {
  if (!userStates[chatId]) {
    userStates[chatId] = {};
  }
  return userStates[chatId];
}

function formatArabicDate(dateStr) {
  const d = new Date(dateStr);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString('ar-SY', options);
}

async function apiCall(method, body = {}) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN) {
    logger.warn('Telegram Bot Token is not set in environment.');
    return { ok: false };
  }

  const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

  try {
    const response = await fetch(`${BASE_URL}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.error(`Telegram API error on ${method}: HTTP ${response.status} - ${errText}`);
      return { ok: false, status: response.status, error: errText };
    }

    return await response.json();
  } catch (error) {
    logger.error(`Telegram fetch error on ${method}:`, error);
    return { ok: false, error: error.message };
  }
}

async function sendMessage(chatId, text, keyboard = []) {
  const body = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown'
  };

  if (keyboard.length > 0) {
    body.reply_markup = { inline_keyboard: keyboard };
  }

  await apiCall('sendMessage', body);
}

async function editMessageText(chatId, messageId, text, keyboard = []) {
  const body = {
    chat_id: chatId,
    message_id: messageId,
    text: text,
    parse_mode: 'Markdown'
  };

  if (keyboard.length > 0) {
    body.reply_markup = { inline_keyboard: keyboard };
  }

  await apiCall('editMessageText', body);
}

async function answerCallbackQuery(callbackQueryId, text = '') {
  const body = {
    callback_query_id: callbackQueryId
  };
  if (text) {
    body.text = text;
  }
  await apiCall('answerCallbackQuery', body);
}

async function handleLogout(chatId, prisma) {
  try {
    await prisma.user.updateMany({
      where: { telegramChatId: String(chatId) },
      data: { telegramChatId: null }
    });
    await sendMessage(chatId, "👋 **تم إلغاء ربط حسابك بالرقم الوطني بنجاح.**\nيمكنك استخدام الأمر `/start` لربط الحساب مجدداً في أي وقت.");
  } catch (err) {
    logger.error('Error logging out via Telegram:', err);
    await sendMessage(chatId, "❌ حدث خطأ أثناء محاولة تسجيل الخروج.");
  }
}

async function sendMainMenu(chatId, text, prisma) {
  const keyboard = [
    [
      { text: '📅 حجز موعد جديد', callback_data: 'book_start' },
      { text: '🚶 الانضمام للطابور', callback_data: 'queue_start' }
    ],
    [
      { text: '📋 مواعيدي النشطة', callback_data: 'my_apps' },
      { text: '💊 وصفاتي الطبية', callback_data: 'my_prescriptions' }
    ],
    [
      { text: '❌ إلغاء ربط الحساب', callback_data: 'logout_start' }
    ]
  ];
  await sendMessage(chatId, text, keyboard);
}

async function startWalkin(chatId, messageId, prisma) {
  const govs = await prisma.governorate.findMany({ orderBy: { nameAr: 'asc' } });
  const keyboard = govs.map(g => ([{ text: g.nameAr, callback_data: `walkin_gov_select:${g.id}` }]));
  keyboard.push([{ text: '🔙 إلغاء والعودة', callback_data: 'menu' }]);
  await editMessageText(chatId, messageId, "🚶 **انضمام لطابور (دخول مباشر)**\n\nالرجاء اختيار المحافظة المتواجد فيها:", keyboard);
}

async function handleUpdate(update, prisma, io) {
  if (update.message) {
    const { chat, text, message_id } = update.message;
    const chatId = chat.id;

    if (!text) return;

    // Check if user is logged in
    const user = await prisma.user.findFirst({
      where: { telegramChatId: String(chatId) },
      include: { patientProfile: true }
    });

    const tokens = text.trim().split(/\s+/);
    const command = tokens[0].toLowerCase();

    if (command === '/start') {
      if (user) {
        await sendMainMenu(chatId, `مرحباً بك مجدداً يا ${user.fullName}. 👋`, prisma);
      } else {
        await sendMessage(chatId, 
          "مرحباً بك في نظام السجل الصحي الوطني السوري. 🇸🇾🩺\n\n" +
          "تتيح لك هذه البوابة حجز المواعيد ومتابعة طوابير الانتظار في العيادات لحظة بلحظة.\n\n" +
          "يرجى ربط حسابك أولاً عن طريق إرسال الرقم الوطني وكلمة المرور بالصيغة التالية:\n" +
          "`/login [الرقم_الوطني] [كلمة_المرور]`\n\n" +
          "مثال:\n" +
          "`/login 123456789 password123`"
        );
      }
      return;
    }

    if (command === '/login') {
      // Delete incoming login message immediately for security to hide password
      apiCall('deleteMessage', { chat_id: chatId, message_id }).catch(err => {
        logger.error('Failed to delete login credentials message:', err);
      });

      if (user) {
        await sendMessage(chatId, `حسابك مربوط بالفعل بالاسم: ${user.fullName}`);
        return;
      }

      const nationalId = tokens[1];
      const password = tokens[2];

      if (!nationalId || !password) {
        await sendMessage(chatId, 
          "❌ صيغة خاطئة.\n" +
          "يرجى إرسال الأمر كالتالي:\n" +
          "`/login [الرقم_الوطني] [كلمة_المرور]`"
        );
        return;
      }

      try {
        const dbUser = await prisma.user.findUnique({
          where: { nationalId },
          include: { patientProfile: true }
        });

        if (!dbUser) {
          await sendMessage(chatId, "❌ الرقم الوطني أو كلمة المرور غير صحيحة.");
          return;
        }

        const isMatch = await bcrypt.compare(password, dbUser.password);
        if (!isMatch) {
          await sendMessage(chatId, "❌ الرقم الوطني أو كلمة المرور غير صحيحة.");
          return;
        }

        if (dbUser.role !== 'PATIENT' || !dbUser.patientProfile) {
          await sendMessage(chatId, "❌ عذراً، خدمة التلغرام مخصصة للمواطنين (المرضى) فقط حالياً.");
          return;
        }

        // Link Telegram
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { telegramChatId: String(chatId) }
        });

        await sendMainMenu(chatId, `✅ تم ربط الحساب بنجاح!\nمرحباً بك يا ${dbUser.fullName} في بوابتك الصحية. 🩺`, prisma);
      } catch (err) {
        logger.error('Error logging in via Telegram:', err);
        await sendMessage(chatId, "❌ حدث خطأ أثناء محاولة ربط الحساب. يرجى المحاولة لاحقاً.");
      }
      return;
    }

    // All other commands require user to be logged in
    if (!user) {
      await sendMessage(chatId, 
        "⚠️ يجب ربط حسابك أولاً لتتمكن من استخدام الخدمة.\n" +
        "أرسل:\n" +
        "`/login [الرقم_الوطني] [كلمة_المرور]`"
      );
      return;
    }

    if (command === '/menu') {
      await sendMainMenu(chatId, "اللوحة الرئيسية للخدمات الصحية: 🩺", prisma);
      return;
    }

    if (command === '/logout') {
      await handleLogout(chatId, prisma);
      return;
    }

    // Default response: show menu
    await sendMainMenu(chatId, "لم أفهم هذا الأمر. يرجى الاختيار من القائمة أدناه: 👇", prisma);
  }

  if (update.callback_query) {
    const { id, message, data } = update.callback_query;
    const chatId = message.chat.id;
    const messageId = message.message_id;

    // Check if user is logged in
    const user = await prisma.user.findFirst({
      where: { telegramChatId: String(chatId) },
      include: { patientProfile: true }
    });

    if (!user) {
      await answerCallbackQuery(id, "يجب ربط الحساب أولاً!");
      return;
    }

    await answerCallbackQuery(id);

    const parts = data.split(':');
    const action = parts[0];

    if (action === 'cancel_menu') {
      delete userStates[chatId]; // Clear state
      await editMessageText(chatId, messageId, "تم إلغاء العملية.");
      await sendMainMenu(chatId, "اللوحة الرئيسية: 🩺", prisma);
      return;
    }

    if (action === 'menu') {
      delete userStates[chatId]; // Clear state
      await sendMainMenu(chatId, "اللوحة الرئيسية: 🩺", prisma);
      return;
    }

    if (action === 'logout_confirm') {
      await handleLogout(chatId, prisma);
      return;
    }

    // Booking flows
    if (action === 'book_start') {
      userStates[chatId] = { flow: 'booking', step: 'gov' };
      const govs = await prisma.governorate.findMany({ orderBy: { nameAr: 'asc' } });
      const keyboard = govs.map(g => ([{ text: g.nameAr, callback_data: `gov_select:${g.id}` }]));
      keyboard.push([{ text: '🔙 العودة للقائمة', callback_data: 'menu' }]);
      await editMessageText(chatId, messageId, "📅 **حجز موعد جديد**\n\nالرجاء اختيار المحافظة:", keyboard);
      return;
    }

    if (action === 'gov_select') {
      const govId = parts[1];
      const state = getState(chatId);
      state.govId = govId;
      state.step = 'spec';

      const specs = await prisma.specialty.findMany({ orderBy: { nameAr: 'asc' } });
      const keyboard = specs.map(s => ([{ text: s.nameAr, callback_data: `spec_select:${s.id}` }]));
      keyboard.push([{ text: '🔙 إلغاء والعودة', callback_data: 'menu' }]);
      await editMessageText(chatId, messageId, "📅 **حجز موعد جديد**\n\nالرجاء اختيار التخصص الطبي المطلوب:", keyboard);
      return;
    }

    if (action === 'spec_select') {
      const specId = parts[1];
      const state = getState(chatId);
      state.specId = specId;
      state.step = 'clinic';

      const clinics = await prisma.clinic.findMany({
        where: {
          governorateId: state.govId,
          users: {
            some: {
              role: 'DOCTOR',
              specialtyId: state.specId
            }
          }
        }
      });

      if (clinics.length === 0) {
        await editMessageText(chatId, messageId, "❌ عذراً، لا تتوفر أي عيادات لهذا التخصص في المحافظة المختارة حالياً.", [
          [{ text: '🔙 العودة للرئيسية', callback_data: 'menu' }]
        ]);
        return;
      }

      const keyboard = clinics.map(c => ([{ text: c.name, callback_data: `clinic_select:${c.id}` }]));
      keyboard.push([{ text: '🔙 إلغاء والعودة', callback_data: 'menu' }]);
      await editMessageText(chatId, messageId, "📅 **حجز موعد جديد**\n\nالرجاء اختيار العيادة أو المشفى:", keyboard);
      return;
    }

    if (action === 'clinic_select') {
      const clinicId = parts[1];
      const state = getState(chatId);
      state.clinicId = clinicId;
      state.step = 'doc';

      const doctors = await prisma.user.findMany({
        where: {
          role: 'DOCTOR',
          specialtyId: state.specId,
          schedules: {
            some: { clinicId: state.clinicId }
          }
        }
      });

      if (doctors.length === 0) {
        await editMessageText(chatId, messageId, "❌ عذراً، لا يتوفر أطباء لهذا التخصص في هذه العيادة حالياً.", [
          [{ text: '🔙 العودة للرئيسية', callback_data: 'menu' }]
        ]);
        return;
      }

      const keyboard = doctors.map(d => ([{ text: `د. ${d.fullName}`, callback_data: `doc_select:${d.id}` }]));
      keyboard.push([{ text: '🔙 إلغاء والعودة', callback_data: 'menu' }]);
      await editMessageText(chatId, messageId, "📅 **حجز موعد جديد**\n\nالرجاء اختيار الطبيب:", keyboard);
      return;
    }

    if (action === 'doc_select') {
      const docId = parts[1];
      const state = getState(chatId);
      state.docId = docId;
      state.step = 'slot';

      const doctor = await prisma.user.findUnique({ where: { id: docId } });
      const clinic = await prisma.clinic.findUnique({ where: { id: state.clinicId } });

      const today = new Date();
      const allSlots = [];

      for (let i = 0; i < 7; i++) {
        const targetDate = new Date();
        targetDate.setDate(today.getDate() + i);

        const slots = await SchedulingService.getAvailableSlots(prisma, state.docId, state.clinicId, targetDate);
        
        let dateLabel = '';
        if (i === 0) {
          dateLabel = 'اليوم';
        } else if (i === 1) {
          dateLabel = 'غداً';
        } else {
          dateLabel = targetDate.toLocaleDateString('ar-SY', { weekday: 'long', day: 'numeric', month: 'numeric' });
        }

        slots.forEach(s => {
          allSlots.push({
            ...s,
            label: `${dateLabel} ${s.start}`
          });
        });
      }

      if (allSlots.length === 0) {
        await editMessageText(chatId, messageId, `❌ عذراً، لا تتوفر أي مواعيد متاحة لدى د. ${doctor.fullName} في ${clinic.name} خلال الـ 7 أيام القادمة.`, [
          [{ text: '🔙 العودة للرئيسية', callback_data: 'menu' }]
        ]);
        return;
      }

      state.slots = allSlots;

      const keyboard = [];
      let currentRow = [];
      allSlots.forEach((slot, index) => {
        currentRow.push({ text: slot.label, callback_data: `slot_select:${index}` });
        if (currentRow.length === 2) {
          keyboard.push(currentRow);
          currentRow = [];
        }
      });
      if (currentRow.length > 0) {
        keyboard.push(currentRow);
      }
      keyboard.push([{ text: '🔙 إلغاء والعودة', callback_data: 'menu' }]);

      await editMessageText(chatId, messageId, `📅 **حجز موعد جديد**\n\nالرجاء اختيار الموعد المتاح لدى د. ${doctor.fullName}:`, keyboard);
      return;
    }

    if (action === 'slot_select') {
      const index = parseInt(parts[1]);
      const state = getState(chatId);
      if (!state.slots || !state.slots[index]) {
        await editMessageText(chatId, messageId, "⚠️ حدث خطأ في حجز الموعد. يرجى البدء من جديد.", [
          [{ text: '🔙 العودة للرئيسية', callback_data: 'menu' }]
        ]);
        return;
      }

      const slot = state.slots[index];

      try {
        const appointment = await BookingService.bookAppointment(prisma, {
          patientId: user.patientProfile.id,
          clinicId: state.clinicId,
          doctorId: state.docId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          bookingType: 'SCHEDULED'
        });

        const doctor = await prisma.user.findUnique({ where: { id: state.docId } });
        const clinic = await prisma.clinic.findUnique({ where: { id: state.clinicId } });

        delete userStates[chatId]; // Clear state

        await editMessageText(chatId, messageId, 
          `✅ **تم حجز الموعد بنجاح!**\n\n` +
          `🏥 **العيادة:** ${clinic.name}\n` +
          `👨‍⚕️ **الطبيب:** د. ${doctor.fullName}\n` +
          `📅 **التاريخ:** ${formatArabicDate(slot.startTime)}\n` +
          `⏰ **الوقت:** ${slot.start}\n` +
          `🔢 **رقم الدور:** ${appointment.queueNumber}\n\n` +
          `يرجى الحضور قبل الموعد بـ 10 دقائق وتأكيد الحضور عبر هذا البوت عند الوصول للعيادة.`,
          [[{ text: '🔙 العودة للرئيسية', callback_data: 'menu' }]]
        );
      } catch (err) {
        logger.error('Error completing booking via Telegram:', err);
        const errMsg = err.message || "الموعد غير متاح حالياً.";
        await editMessageText(chatId, messageId, `❌ **فشل حجز الموعد:**\n\n${errMsg}`, [
          [{ text: '🔙 العودة للرئيسية', callback_data: 'menu' }]
        ]);
      }
      return;
    }

    // Queue / Check-in Flows
    if (action === 'queue_start') {
      const today = new Date();
      const appointmentsToday = await prisma.appointment.findMany({
        where: {
          patientId: user.patientProfile.id,
          date: {
            gte: startOfDay(today),
            lte: endOfDay(today)
          },
          status: 'BOOKED',
          bookingType: 'SCHEDULED'
        },
        include: { clinic: true, user: true }
      });

      if (appointmentsToday.length > 0) {
        const keyboard = appointmentsToday.map(app => ([{
          text: `🚪 تسجيل حضور في عيادة ${app.clinic.name} - د. ${app.user.fullName}`,
          callback_data: `checkin:${app.id}`
        }]));
        keyboard.push([{ text: '🚶 الانضمام لدور بدون موعد مسبق (Walk-in)', callback_data: 'walkin_start' }]);
        keyboard.push([{ text: '🔙 العودة للرئيسية', callback_data: 'menu' }]);

        await editMessageText(chatId, messageId, "🚶 **تسجيل الحضور في الطابور**\n\nلديك مواعيد محجوزة اليوم. يرجى اختيار العيادة لتسجيل حضورك الفعلي والبدء بالانتظار:", keyboard);
      } else {
        await startWalkin(chatId, messageId, prisma);
      }
      return;
    }

    if (action === 'walkin_start') {
      await startWalkin(chatId, messageId, prisma);
      return;
    }

    if (action === 'walkin_gov_select') {
      const govId = parts[1];
      const state = getState(chatId);
      state.flow = 'walkin';
      state.govId = govId;

      const clinics = await prisma.clinic.findMany({
        where: { governorateId: govId }
      });

      if (clinics.length === 0) {
        await editMessageText(chatId, messageId, "❌ لا تتوفر عيادات في هذه المحافظة حالياً.", [
          [{ text: '🔙 العودة للرئيسية', callback_data: 'menu' }]
        ]);
        return;
      }

      const keyboard = clinics.map(c => ([{ text: c.name, callback_data: `walkin_clinic_select:${c.id}` }]));
      keyboard.push([{ text: '🔙 العودة للرئيسية', callback_data: 'menu' }]);
      await editMessageText(chatId, messageId, "🚶 **انضمام لطابور (دخول مباشر)**\n\nالرجاء اختيار العيادة التي تتواجد فيها الآن:", keyboard);
      return;
    }

    if (action === 'walkin_clinic_select') {
      const clinicId = parts[1];
      const state = getState(chatId);
      state.clinicId = clinicId;

      const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });

      const keyboard = [
        [
          { text: '✅ نعم، تأكيد الانضمام', callback_data: 'walkin_confirm' },
          { text: '❌ إلغاء', callback_data: 'menu' }
        ]
      ];

      await editMessageText(chatId, messageId, `🚶 **انضمام لطابور (دخول مباشر)**\n\nهل أنت متواجد حالياً في **${clinic.name}** وترغب في حجز دور مباشر (Walk-in) في الطابور اليوم؟`, keyboard);
      return;
    }

    if (action === 'walkin_confirm') {
      const state = getState(chatId);
      const clinicId = state.clinicId;

      if (!clinicId) {
        await editMessageText(chatId, messageId, "⚠️ حدث خطأ في معالجة طلبك. يرجى المحاولة مجدداً.", [[{ text: '🔙 للرئيسية', callback_data: 'menu' }]]);
        return;
      }

      try {
        const todayStart = new Date();
        todayStart.setHours(0,0,0,0);

        const existing = await prisma.appointment.findFirst({
          where: {
            patientId: user.patientProfile.id,
            clinicId,
            status: { in: ['WAITING', 'IN_SESSION'] },
            date: { gte: todayStart }
          }
        });

        if (existing) {
          await editMessageText(chatId, messageId, "⚠️ أنت مسجل بالفعل في طابور هذه العيادة اليوم وقيد الانتظار.", [[{ text: '🔙 للرئيسية', callback_data: 'menu' }]]);
          return;
        }

        const count = await prisma.appointment.count({
          where: {
            clinicId,
            date: { gte: todayStart }
          }
        });

        const appointment = await prisma.appointment.create({
          data: {
            clinicId,
            patientId: user.patientProfile.id,
            queueNumber: count + 1,
            status: 'WAITING',
            bookingType: 'WALK_IN'
          },
          include: { patient: { include: { user: true } } }
        });

        const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });

        io.to(`clinic_${clinicId}`).emit('queue_updated', appointment);

        delete userStates[chatId]; // Clear state

        await editMessageText(chatId, messageId, 
          `✅ **تم الانضمام للطابور بنجاح!**\n\n` +
          `🏥 **العيادة:** ${clinic.name}\n` +
          `🔢 **رقم دورك في الانتظار:** ${appointment.queueNumber}\n\n` +
          `يرجى مراقبة شاشات الطابور بالعيادة. سيتم مناداة رقمك عند وصول دورك.`,
          [[{ text: '🔙 العودة للرئيسية', callback_data: 'menu' }]]
        );
      } catch (err) {
        logger.error('Error joining queue via Telegram:', err);
        await editMessageText(chatId, messageId, `❌ حدث خطأ أثناء الانضمام للطابور: ${err.message}`, [[{ text: '🔙 للرئيسية', callback_data: 'menu' }]]);
      }
      return;
    }

    if (action === 'checkin') {
      const appId = parts[1];
      try {
        const appointment = await prisma.appointment.findUnique({
          where: { id: appId },
          include: { clinic: true, user: true }
        });

        if (!appointment || appointment.status !== 'BOOKED') {
          await editMessageText(chatId, messageId, "⚠️ لا يمكن تسجيل الحضور لهذا الموعد. قد يكون مسجلاً بالفعل أو ملغى.", [[{ text: '🔙 للرئيسية', callback_data: 'menu' }]]);
          return;
        }

        const updatedApp = await prisma.appointment.update({
          where: { id: appId },
          data: { status: 'WAITING', isConfirmed: true },
          include: { patient: { include: { user: true } } }
        });

        io.to(`clinic_${appointment.clinicId}`).emit('queue_updated', updatedApp);

        await editMessageText(chatId, messageId, 
          `✅ **تم تسجيل حضورك وبدء الانتظار في العيادة!**\n\n` +
          `🏥 **العيادة:** ${appointment.clinic.name}\n` +
          `👨‍⚕️ **الطبيب:** د. ${appointment.user.fullName}\n` +
          `🔢 **رقم دورك الحالي:** ${updatedApp.queueNumber}\n\n` +
          `يرجى الانتظار في الصالة حتى يتم استدعاء دورك.`,
          [[{ text: '🔙 العودة للرئيسية', callback_data: 'menu' }]]
        );
      } catch (err) {
        logger.error('Error checking in via Telegram:', err);
        await editMessageText(chatId, messageId, `❌ حدث خطأ أثناء تسجيل حضورك: ${err.message}`, [[{ text: '🔙 للرئيسية', callback_data: 'menu' }]]);
      }
      return;
    }

    // List Appointments
    if (action === 'my_apps') {
      try {
        const apps = await prisma.appointment.findMany({
          where: {
            patientId: user.patientProfile.id,
            status: { in: ['BOOKED', 'WAITING', 'IN_SESSION'] }
          },
          include: { clinic: true, user: true },
          orderBy: { startTime: 'asc' }
        });

        if (apps.length === 0) {
          await editMessageText(chatId, messageId, "📋 **مواعيدك النشطة**\n\nليس لديك أي مواعيد نشطة حالياً.", [
            [{ text: '📅 حجز موعد جديد', callback_data: 'book_start' }],
            [{ text: '🔙 العودة للرئيسية', callback_data: 'menu' }]
          ]);
          return;
        }

        let msg = "📋 **مواعيدك النشطة الحالية:**\n\n";
        const keyboard = [];

        apps.forEach((app, idx) => {
          const dateStr = app.startTime ? formatArabicDate(app.startTime) : 'دخول مباشر اليوم';
          const timeStr = app.startTime ? format(new Date(app.startTime), 'HH:mm') : '';
          const statusText = app.status === 'BOOKED' ? 'مؤكد (بانتظار الحضور)' : app.status === 'WAITING' ? 'قيد الانتظار (في الطابور)' : 'قيد المعاينة 🩺';

          msg += `${idx + 1}. 🏥 **${app.clinic.name}**\n` +
                 `   👨‍⚕️ **الطبيب:** د. ${app.user?.fullName || 'غير محدد'}\n` +
                 `   📅 **الموعد:** ${dateStr} ${timeStr}\n` +
                 `   🔢 **رقم الدور:** ${app.queueNumber}\n` +
                 `   ⚙️ **الحالة:** ${statusText}\n\n`;

          if (app.status === 'BOOKED' || app.status === 'WAITING') {
            keyboard.push([{ text: `❌ إلغاء الموعد (${idx + 1})`, callback_data: `cancel:${app.id}` }]);
          }
        });

        keyboard.push([{ text: '🔙 العودة للرئيسية', callback_data: 'menu' }]);
        await editMessageText(chatId, messageId, msg, keyboard);
      } catch (err) {
        logger.error('Error fetching appointments via Telegram:', err);
        await editMessageText(chatId, messageId, "❌ حدث خطأ أثناء جلب قائمة مواعيدك.", [[{ text: '🔙 للرئيسية', callback_data: 'menu' }]]);
      }
      return;
    }

    if (action === 'cancel') {
      const appId = parts[1];
      try {
        const appointment = await prisma.appointment.findUnique({
          where: { id: appId },
          include: { clinic: true }
        });

        if (!appointment) {
          await editMessageText(chatId, messageId, "⚠️ الموعد غير موجود أو تم إلغاؤه بالفعل.", [[{ text: '🔙 للرئيسية', callback_data: 'menu' }]]);
          return;
        }

        const updated = await prisma.appointment.update({
          where: { id: appId },
          data: { status: 'CANCELLED' },
          include: { patient: { include: { user: true } } }
        });

        io.to(`clinic_${appointment.clinicId}`).emit('queue_updated', updated);

        await AuditService.log(prisma, {
          action: 'UPDATE',
          entity: 'APPOINTMENT',
          entityId: appId,
          userId: user.id,
          details: { message: "Appointment cancelled via Telegram Bot" }
        });

        await editMessageText(chatId, messageId, "❌ **تم إلغاء الموعد بنجاح.**", [[{ text: '🔙 العودة للرئيسية', callback_data: 'menu' }]]);
      } catch (err) {
        logger.error('Error cancelling appointment via Telegram:', err);
        await editMessageText(chatId, messageId, "❌ حدث خطأ أثناء محاولة إلغاء الموعد.", [[{ text: '🔙 للرئيسية', callback_data: 'menu' }]]);
      }
      return;
    }

    // Prescriptions List
    if (action === 'my_prescriptions') {
      try {
        const prescriptions = await prisma.prescription.findMany({
          where: { patientId: user.patientProfile.id },
          include: {
            encounter: { include: { doctor: true, clinic: true } },
            items: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        });

        if (prescriptions.length === 0) {
          await editMessageText(chatId, messageId, "💊 **وصفاتك الطبية**\n\nلا توجد وصفات طبية مسجلة باسمك في النظام حالياً.", [[{ text: '🔙 للرئيسية', callback_data: 'menu' }]]);
          return;
        }

        let msg = "💊 **آخر وصفاتك الطبية الإلكترونية:**\n\n";
        prescriptions.forEach((p, idx) => {
          const statusText = p.status === 'PENDING' ? 'غير مسلّمة 🔴' : p.status === 'PARTIAL' ? 'مسلّمة جزئياً 🟡' : 'مسلّمة بالكامل 🟢';
          msg += `${idx + 1}. 🏥 **المصدر:** ${p.encounter.clinic.name}\n` +
                 `   👨‍⚕️ **الطبيب:** د. ${p.encounter.doctor.fullName}\n` +
                 `   📅 **التاريخ:** ${formatArabicDate(p.createdAt)}\n` +
                 `   ⚙️ **الحالة:** ${statusText}\n` +
                 `   📦 **الأدوية الموصوفة:**\n`;

          p.items.forEach(item => {
            const itemStatus = item.status === 'DISPENSED' ? '[تم الصرف]' : '[معلق]';
            msg += `     - ${item.drugName} (الجرعة: ${item.dosage}) x ${item.quantity} ${itemStatus}\n`;
          });
          msg += `\n`;
        });

        await editMessageText(chatId, messageId, msg, [[{ text: '🔙 العودة للرئيسية', callback_data: 'menu' }]]);
      } catch (err) {
        logger.error('Error fetching prescriptions via Telegram:', err);
        await editMessageText(chatId, messageId, "❌ حدث خطأ أثناء جلب قائمة وصفاتك الطبية.", [[{ text: '🔙 للرئيسية', callback_data: 'menu' }]]);
      }
      return;
    }

    if (action === 'logout_start') {
      const keyboard = [
        [
          { text: '✅ نعم، إلغاء الربط', callback_data: 'logout_confirm' },
          { text: '❌ تراجع', callback_data: 'menu' }
        ]
      ];
      await editMessageText(chatId, messageId, "⚠️ **إلغاء ربط الحساب**\n\nهل أنت متأكد من رغبتك في إلغاء ربط هذا الحساب الوطني بالتلغرام؟ لن تتمكن من حجز مواعيد أو تتبع طابورك عبر البوت إلا بعد تسجيل الدخول مجدداً.", keyboard);
      return;
    }
  }
}

let offset = 0;
let isPolling = false;

async function pollUpdates(prisma, io) {
  if (isPolling) return;
  isPolling = true;

  while (isPolling) {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) {
      logger.warn('Telegram Bot Token is missing. Disabling Telegram Service.');
      isPolling = false;
      break;
    }

    try {
      const res = await apiCall('getUpdates', { offset, timeout: 20 });
      if (res && res.ok && res.result && res.result.length > 0) {
        for (const update of res.result) {
          offset = update.update_id + 1;
          await handleUpdate(update, prisma, io);
        }
      }
    } catch (err) {
      logger.error('Error in Telegram polling loop:', err);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

export function initTelegramBot(prisma, io) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN) {
    logger.warn('TELEGRAM_BOT_TOKEN is not defined in .env. Telegram Bot service is disabled.');
    return;
  }

  logger.info('Initializing Telegram Bot Service...');
  pollUpdates(prisma, io).catch(err => {
    logger.error('Failed to start Telegram updates polling:', err);
  });
}

export async function sendTelegramNotification(chatId, text) {
  if (!chatId) return;
  try {
    const res = await apiCall('sendMessage', {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    });
    if (res && res.ok) {
      logger.info(`Telegram notification sent successfully to chat ${chatId}`);
    } else {
      logger.warn(`Failed to send Telegram notification to chat ${chatId}: ${JSON.stringify(res)}`);
    }
  } catch (error) {
    logger.error(`Error sending Telegram notification to ${chatId}:`, error);
  }
}
