import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Translation {
  [key: string]: string | Translation;
}

export interface Translations {
  ar: Translation;
  en: Translation;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguageSubject = new BehaviorSubject<string>('ar');
  public currentLanguage$: Observable<string> = this.currentLanguageSubject.asObservable();

  private translations: Translations = {
    ar: {
      nav: {
        home: 'الرئيسية',
        about: 'من نحن',
        testimonials: 'الآراء',
        library: 'المكتبة',
        news: 'اخر الاخبار',
        joinUs: 'انضم إلينا',
        leaderboards: 'المتصدرون',
        contact: 'تواصل معنا',
        dashboard: 'لوحة التحكم',
        profile: 'الملف الشخصي',
        login: 'تسجيل الدخول',
        logout: 'تسجيل الخروج'
      },
      profile: {
        title: 'الملف الشخصي',
        personalInfo: 'المعلومات الشخصية',
        name: 'الاسم',
        email: 'البريد الإلكتروني',
        phone: 'الهاتف',
        address: 'العنوان',
        academicSpecialization: 'التخصص الأكاديمي',
        volunteerHours: 'ساعات التطوع',
        numberOfStudents: 'عدد الطلاب',
        subjects: 'المواد',
        lectureCount: 'عدد المحاضرات',
        notSpecified: 'غير محدد',
        profileImage: 'صورة الملف الشخصي',
        defaultImage: 'صورة افتراضية',
        changeImage: 'تغيير الصورة',
        uploadImage: 'رفع الصورة',
        uploading: 'جاري الرفع...',
        adminMessage: 'رسالة من الإدارة',
        profileTab: 'الملف الشخصي',
        studentsTab: 'الطلاب',
        meetingsTab: 'المواعيد',
        pdfRequestTab: 'رفع محاضرة PDF',
        notificationsTab: 'الإشعارات',
        changePasswordTab: 'تغيير كلمة المرور',
        studentsTitle: 'الطلاب',
        noStudents: 'لا يوجد طلاب مسجلين.',
        studentDataMismatch: 'يوجد طلاب مسجلين، لكن تفاصيل الطلاب غير متوفرة حاليًا. يرجى التواصل مع الإدارة.',
        studentName: 'الاسم',
        studentEmail: 'البريد الإلكتروني',
        studentPhone: 'الهاتف',
        studentGrade: 'الصف',
        studentSubjects: 'المواد',
        notAvailable: 'غير متوفر',
        meetingsTitle: 'المواعيد',
        addMeeting: 'إضافة موعد',
        noMeetings: 'لا يوجد مواعيد مسجلة.',
        meetingTitle: 'العنوان',
        meetingDate: 'التاريخ',
        startTime: 'وقت البدء',
        endTime: 'وقت الانتهاء',
        actions: 'الإجراءات',
        delete: 'حذف',
        deleting: 'جاري الحذف...',
        confirmDeleteMeeting: 'هل أنت متأكد من حذف هذا الموعد؟',
        close: 'إغلاق',
        saveMeeting: 'حفظ الموعد',
        addLecture: 'إضافة محاضرة',
        lectureLink: 'رابط المحاضرة',
        lectureLinkPlaceholder: 'أدخل رابط المحاضرة (مثال: https://example.com)',
        lectureName: 'اسم المحاضرة',
        lectureNamePlaceholder: 'أدخل اسم المحاضرة',
        lectureSubject: 'المادة',
        selectSubject: 'اختر المادة',
        uploadLecture: 'رفع المحاضرة',
        uploadingLecture: 'جاري الرفع...',
        pdfRequestTitle: 'طلب رفع محاضرة PDF',
        pdfTitle: 'عنوان المحاضرة',
        pdfTitlePlaceholder: 'أدخل عنوان المحاضرة',
        pdfDescription: 'وصف المحاضرة',
        pdfDescriptionPlaceholder: 'أدخل وصف تفصيلي للمحاضرة',
        pdfCreatorName: 'اسم منشئ المحاضرة',
        pdfCreatorNamePlaceholder: 'أدخل اسم منشئ المحاضرة',
        pdfFile: 'ملف المحاضرة (PDF)',
        pdfFileNote: 'الحد الأقصى لحجم الملف: 10 ميغابايت، الصيغة المدعومة: PDF فقط',
        semester: 'الفصل الدراسي',
        selectSemester: 'اختر الفصل الدراسي',
        country: 'الدولة',
        selectCountry: 'اختر الدولة',
        academicLevel: 'المرحلة الدراسية',
        selectAcademicLevel: 'اختر المرحلة الدراسية',
        submitPdfRequest: 'إرسال طلب رفع المحاضرة',
        submittingPdfRequest: 'جاري إرسال الطلب...',
        importantNotes: 'ملاحظات مهمة:',
        note1: 'سيتم مراجعة طلبك من قبل الإدارة قبل الموافقة على النشر',
        note2: 'يُرجى التأكد من صحة جميع المعلومات المدخلة',
        note3: 'الملف المرفوع يجب أن يكون بصيغة PDF فقط',
        note4: 'الحد الأقصى لحجم الملف هو 10 ميغابايت',
        note5: 'ستتلقى إشعارًا عند الموافقة على الطلب أو رفضه',
        notificationsTitle: 'الإشعارات',
        noNotifications: 'لا توجد إشعارات جديدة.',
        markAllRead: 'تحديد الكل كمقروء',
        changePassword: 'تغيير كلمة المرور',
        currentPassword: 'كلمة المرور الحالية',
        newPassword: 'كلمة المرور الجديدة',
        saveChanges: 'حفظ التغييرات',
        forgotPassword: 'هل نسيت كلمة المرور؟',
        success: 'نجاح',
        error: 'خطأ',
        loadSuccess: 'تم جلب بيانات الملف الشخصي بنجاح',
        loadError: 'فشل في جلب بيانات الملف الشخصي',
        imageUploadSuccess: 'تم رفع الصورة بنجاح',
        imageUploadError: 'فشل في رفع الصورة',
        lectureUploadSuccess: 'تم رفع المحاضرة بنجاح',
        lectureUploadError: 'فشل في رفع المحاضرة',
        pdfRequestSuccess: 'تم إرسال طلب رفع المحاضرة بنجاح',
        pdfRequestError: 'فشل في رفع طلب المحاضرة',
        meetingAddSuccess: 'تم إضافة الموعد بنجاح',
        meetingAddError: 'فشل في إضافة الموعد',
        meetingDeleteSuccess: 'تم حذف الموعد بنجاح',
        meetingDeleteError: 'فشل في حذف الموعد',
        passwordChangeSuccess: 'تم تغيير كلمة المرور بنجاح',
        passwordChangeError: 'فشل في تغيير كلمة المرور',
        notificationsLoadSuccess: 'تم جلب الإشعارات بنجاح',
        notificationsLoadError: 'فشل في جلب الإشعارات',
        notificationsMarkedRead: 'تم تحديد الإشعارات كمقروءة',
        notificationsMarkError: 'فشل في تحديد الإشعارات كمقروءة',
        notificationDeleted: 'تم حذف الإشعار بنجاح',
        notificationDeleteError: 'فشل في حذف الإشعار',
        networkError: 'فشل في الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.',
        unauthorizedError: 'غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.',
        forbiddenError: 'ليس لديك الإذن لتنفيذ هذا الإجراء.',
        badRequestError: 'طلب غير صالح. يرجى التحقق من البيانات المدخلة.',
        serverError: 'خطأ في الخادم. يرجى المحاولة لاحقًا.',
        unexpectedError: 'حدث خطأ غير متوقع.',
        fileSizeError: 'حجم الملف كبير جدًا. الحد الأقصى 10 ميغابايت',
        pdfFileTypeError: 'الملفات المسموح بها هي: PDF فقط',
        selectImageFirst: 'يرجى اختيار صورة أولاً',
        selectPdfFile: 'يرجى اختيار ملف PDF للرفع',
        fillAllFields: 'يرجى ملء جميع الحقول بشكل صحيح',
        passwordFieldsRequired: 'يرجى إدخال كلمة المرور الحالية والجديدة',
        meetingFieldsRequired: 'يرجى إدخال جميع تفاصيل الموعد',
        validation: {
          link: {
            required: 'رابط المحاضرة مطلوب',
            pattern: 'يرجى إدخال رابط صالح'
          },
          name: {
            required: 'اسم المحاضرة مطلوب',
            minlength: 'اسم المحاضرة قصير جدًا',
            maxlength: 'اسم المحاضرة طويل جدًا (الحد الأقصى 100 حرف)'
          },
          subject: {
            required: 'اسم المادة مطلوب'
          },
          title: {
            required: 'عنوان المحاضرة مطلوب',
            minlength: 'العنوان قصير جدًا (الحد الأدنى 3 أحرف)',
            maxlength: 'العنوان طويل جدًا (الحد الأقصى 100 حرف)'
          },
          description: {
            required: 'وصف المحاضرة مطلوب',
            minlength: 'الوصف قصير جدًا (الحد الأدنى 10 أحرف)',
            maxlength: 'الوصف طويل جدًا (الحد الأقصى 500 حرف)'
          },
          creatorName: {
            required: 'اسم منشئ المحاضرة مطلوب',
            minlength: 'الاسم قصير جدًا (الحد الأدنى حرفان)',
            maxlength: 'الاسم طويل جدًا (الحد الأقصى 50 حرف)'
          },
          semester: {
            required: 'الفصل الدراسي مطلوب'
          },
          country: {
            required: 'الدولة مطلوبة'
          },
          academicLevel: {
            required: 'المرحلة الدراسية مطلوبة'
          }
        }
      },
      home: {
        heroTitle: 'مبادرة التعليم الإلكتروني عن بعد',
        heroSubtitle: 'قطرة غيث',
        heroDescription: 'نحو مستقبل تعليمي أفضل للجميع',
        discoverMore: 'اكتشف المزيد عنا',
        volunteer: 'تطوع معنا',
        aboutUs: 'من نحن',
        aboutTitle: 'لمحة عننا',
        aboutDescription: 'نحن مبادرة خيرية تعليمية تأسست عام 2020 هدفها مساعدة الطلاب الذين بحاجة لدراسة خاصة ولا تتوفر لهم الإمكانيات، من خلال استقطاب طلاب جامعيين أو خريجين للقيام بالمهمة. توفر المبادرة بيئة تعليمية عن بعد لدعم جميع الصفوف وبجميع المواد الدراسية، إلى جانب التأسيس لمن هو بحاجة. يتم التعليم عن بعد عبر الإنترنت باستخدام تطبيقات مثل زووم وتيمز وغيرها، حيث تكون الحصص مباشرة ويتم تسجيلها من قبل المتطوعين ومراجعتها من مختصين لضمان سير العملية التعليمية بنجاح.',
        achievements: 'إنجازاتنا',
        achievementsTitle: 'إنجازات',
        achievementsDescription: 'أرقام تتحدث عن رحلتنا في خدمة التعليم',
        yearsExperience: 'سنة خبرة',
        activities: 'نشاط وخدمة',
        volunteers: 'متطوع',
        volunteerHours: 'ساعات تطوع',
        beneficiaries: 'مستفيد',
        helpSection: 'كيف تساعد',
        joinToday: 'انضم إلينا اليوم',
        helpDescription: 'ساهم في دعم مجتمعنا من خلال التبرع أو الانضمام إلى فريقنا.',
        donateContact: 'تواصل معنا للتبرع',
        joinUs: 'الانضمام إلينا',
        contactUs: 'اتصل بنا',
        contactTitle: 'تواصلوا معنا',
        contactDescription: 'يسعدنا التواصل معكم للدعم مبادراتنا المجتمعية.',
        contactInfo: 'معلومات التواصل معنا',
        name: 'الاسم',
        email: 'البريد الإلكتروني',
        phone: 'الهاتف',
        address: 'عمان',
        message: 'رسالتك',
        send: 'إرسال',
        workingHours: 'نحن متاحون للرد على استفساراتكم من الساعة 8:00 ص إلى 4:00 م',
        namePlaceholder: 'أدخل اسمك',
        nameRequired: 'الاسم مطلوب',
        nameMinLength: 'الاسم يجب أن يكون ${requiredLength} أحرف على الأقل',
        nameMaxLength: 'الاسم يجب ألا يتجاوز ${maxLength} حرف',
        nameValid: 'الاسم صالح',
        emailPlaceholder: 'example@domain.com',
        emailRequired: 'البريد الإلكتروني مطلوب',
        emailInvalid: 'البريد الإلكتروني غير صالح',
        emailValid: 'البريد الإلكتروني صالح',
        phonePlaceholder: '07xxxxxxxx',
        phoneRequired: 'رقم الهاتف مطلوب',
        phonePattern: 'رقم الهاتف غير صالح',
        phoneValid: 'رقم الهاتف صالح',
        service: 'الخدمة',
        selectService: 'اختر الخدمة',
        educationalPrograms: 'البرامج التعليمية',
        volunteering: 'التطوع',
        support: 'الدعم',
        partnership: 'الشراكة',
        donation: 'التبرع',
        other: 'أخرى',
        serviceRequired: 'الخدمة مطلوبة',
        serviceValid: 'الخدمة صالحة',
        messagePlaceholder: 'أدخل رسالتك هنا',
        messageRequired: 'الرسالة مطلوبة',
        messageMinLength: 'الرسالة يجب أن تكون ${requiredLength} أحرف على الأقل',
        messageMaxLength: 'الرسالة يجب ألا تتجاوز ${maxLength} حرف',
        messageValid: 'الرسالة صالحة',
        charCount: 'عدد الحروف',
        submitting: 'جاري الإرسال',
        clearForm: 'مسح النموذج',
        successMessage: 'تم إرسال الرسالة بنجاح!',
        errorMessage: 'حدث خطأ أثناء الإرسال',
        formInvalid: 'يرجى ملء النموذج بشكل صحيح',
        whatsappMessage: 'مرحبا، اسمي ${name}، بريدي ${email}، هاتفي ${phone}، أريد الاستفسار عن ${service}: ${message}',
        followUs: 'تابعنا',
        socialMediaDescription: 'ابق على اطلاع بآخر أخبارنا وفعالياتنا'
      },
      about: {
        introductionTitle: 'التعريف العام عن المبادرة',
        introductionDescription: 'نحن مبادرة خيرية تعليمية تأسست عام 2020 هدفها مساعدة الطلاب الذين بحاجة لدراسة خاصة ولا تتوفر لهم الإمكانيات، من خلال استقطاب طلاب جامعيين أو خريجين للقيام بالمهمة. توفر المبادرة بيئة تعليمية عن بعد لدعم جميع الصفوف وبجميع المواد الدراسية، إلى جانب التأسيس لمن هو بحاجة. يتم التعليم عن بعد عبر الإنترنت باستخدام تطبيقات مثل زووم وتيمز وغيرها، حيث تكون الحصص مباشرة ويتم تسجيلها من قبل المتطوعين ومراجعتها من مختصين لضمان سير العملية التعليمية بنجاح.',
        imageAlt: 'طالب منخرط في التعلم',
        coverageTitle: 'الجهات التي تغطيها المبادرة',
        coverageOrphans: 'الأيتام واصحاب الدخل المحدود',
        coverageOrphansAlt: 'الأيتام واصحاب الدخل المحدود',
        coverageChronic: 'مرضى الأمراض المزمنة',
        coverageChronicAlt: 'مرضى السرطان',
        coverageGaza: 'طلاب مدينة غزة',
        coverageGazaAlt: 'طلاب مدينة غزة',
        valuesTitle: 'قيمنا ورسالتنا وأهدافنا',
        goalsTitle: 'أهدافنا',
        goalsDescription: 'نحن نهدف إلى "أن نكون قدوة" في العمل الجاد والالتزام',
        missionTitle: 'رسالتنا',
        missionDescription: 'نركز على تطوير المهارات وتنمية القدرات لدى الشباب',
        valuesCardTitle: 'قيمنا',
        valuesDescription: 'نعمل على تعزيز ثقة الطلاب ونشر ثقافة التطوع',
        accreditationTitle: 'اعتماد المبادرة',
        accreditationSubtitle: 'المبادرة معتمدة على منصة نحن كمبادرة رسمية. هذا الاعتماد يفيد المتطوعين بالعديد من المزايا والفوائد المهمة.',
        accreditationBadgeTitle: 'مبادرة معتمدة',
        accreditationBadgeSubtitle: 'منصة نحن الرسمية',
        benefitsTitle: 'مزايا الاعتماد للمتطوعين',
        benefitVolunteerHoursTitle: 'اعتماد ساعات التطوع',
        benefitVolunteerHoursDescription: 'اعتماد ساعات التطوع كخدمة مجتمع للمتطوع داخل المملكة الأردنية الهاشمية',
        benefitAcademicPointsTitle: 'نقاط أكاديمية',
        benefitAcademicPointsDescription: 'الحصول على نقاط على مادة خدمة مجتمع في الجامعات',
        benefitGrantsPointsTitle: 'نقاط إضافية للمنح',
        benefitGrantsPointsDescription: 'نقاط إضافية على المنح الخارجية التي تكون من قبل الحكومات',
        benefitCertificatesTitle: 'شهادات معتمدة',
        benefitCertificatesDescription: 'الحصول على شهادات معتمدة من منصة نحن للمتطوعين',
        partnersTitle: 'شراكات واعتمادات',
        partnersSubtitle: 'نفتخر بشراكتنا مع مؤسسات وجهات محترمة تساهم في دعم رسالتنا التعليمية والتطوعية',
        partnerCrownPrince: 'مؤسسة ولي العهد',
        partnerCrownPrinceAlt: 'شعار مؤسسة ولي العهد',
        partnerNamaa: 'جمعية نماء',
        partnerNamaaAlt: 'شعار جمعية نماء',
        partner180: 'مؤسسة 180',
        partner180Alt: 'شعار مؤسسة 180',
        partnerJoAcademy: 'جو اكاديمي',
        partnerJoAcademyAlt: 'شعار جو اكاديمي',
        partnerNahn: 'منصة نحن',
        partnerNahnAlt: 'شعار منصة نحن',
        trustVerified: 'شراكات موثقة ومعتمدة',
        trustPartners: 'أكثر من 5 شركاء استراتيجيين',
        trustSupport: 'دعم مستمر للمبادرة',
        volunteerTitle: 'انضم إلينا',
        volunteerButton: 'تطوع معنا'
      },
      testimonials: {
        heroTitle: 'آراء المستفيدين',
        heroDescription: 'نَبني أُمّة لتحي أُمّة، لا يسودها الأُمّية؛ لنبني حضارة',
        viewAllButton: 'عرض جميع الآراء',
        valueExperience: 'الخبرة',
        valueLearning: 'التعلم',
        valueHumanity: 'الإنسانية',
        profileAlt: 'صورة الملف الشخصي',
        placeholderText: '...',
        noTestimonials: 'لا توجد شهادات متاحة حاليًا',
        errorDefault: 'خطأ في جلب الشهادات'
      },
      library: {
        title: 'مكتبة ملفات PDF',
        clearSearch: 'حذف البحث',
        searchPlaceholder: 'ابحث في العناوين...',
        allSubjects: 'كل المواد',
        allCreators: 'كل المنشئين',
        allAcademicLevels: 'كل السنوات الدراسية',
        allCountries: 'كل الدول',
        fileNameLabel: 'اسم الملف:',
        createdAtLabel: 'تاريخ الرفع:',
        openFile: 'فتح الملف',
        share: 'مشاركة',
        noPdfs: 'لا توجد ملفات PDF لعرضها',
        noResults: 'لا توجد نتائج تطابق البحث المحدد',
        errorLoadingPdfs: 'حدث خطأ في تحميل الملفات',
        invalidId: 'معرف الملف غير صحيح',
        popupBlocked: 'فشل في فتح الملف. تأكد من السماح للنوافذ المنبثقة',
        fileOpened: 'تم فتح الملف بنجاح',
        errorOpeningFile: 'حدث خطأ في فتح الملف',
        errorLoadingFile: 'فشل في تحميل الملف',
        linkCopied: 'تم نسخ رابط المشاركة بنجاح',
        copyFailed: 'فشل في نسخ الرابط. يرجى النسخ يدوياً'
      },
      gallery: {
        title: 'معرض الصور',
        subtitle: 'صور مُلهمة من مبادرتنا التعليمية والخيرية، لتدّريس وتقديم أنشطة تعليمية لكُل طالب عِلم، من خلال مشاركة متطوعين مختصين بالتعليم وبالدعم النفسي والإداري.',
        sectionBadge: 'معرض الصور',
        sectionTitle: 'ألبوم الصور الخاص بنا',
        sectionDescription: 'استعرض مجموعتنا من الصور التي تعكس جهودنا في دعم الأطفال ومرضى السرطان في غزة.',
        viewGallery: 'شاهد معرض الصور',
        featuredActivities: 'أنشطة مميزة',
        latestEvents: 'أحدث الفعاليات',
        latestEventsDescription: 'أنشطة تعليمية وتحفيزية مع طلبتنا في جمعية نماء الخيرية ولقطات حية من دروس الدعم المجانية، والأنشطة الترفيهية والتعليمية.',
        impactfulActivities: 'الأنشطة المؤثرة',
        impactfulActivitiesDescription: 'لقطات من أكثر الفعاليات تأثيراً، والتي أبرزت أهمية التعليم والدعم النفسي.',
        humanitarianMessage: 'رسالة إنسانية وتعليمية',
        humanitarianMessageDescription1: 'تُظهر هذه الصور جهود مبادرتنا التطوعية التعليمية في توفير بيئة تعليمية آمنة ومحفزة لطلبتنا من خلال معلمين ومتطوعين وإداريين مختصين يقدمون الوقت والجهد من أجل مستقبل أفضل.',
        humanitarianMessageDescription2: 'كل صورة تروي قصة أمل، وتعكس قوة العمل الجماعي وروح العطاء في سبيل مساعدة الآخرين.',
        allImages: 'جميع الصور',
        allImagesDescription: 'هُنا مجموعتنا الشاملة من الصور التي توثق رحلتنا في دعم التعليم لكُل طالب عِلم.',
        errorLoadingImages: 'فشل في تحميل صور المعرض'
      },
      joinUs: {
        welcomeTitle: 'أهلاً بكم!',
        welcomeSubtitle: 'انضم إلينا والى المؤسسة وكن جزءًا من مبادراتنا. نحن هنا لنبني مستقبلاً مشرقاً معاً!',
        formTitle: 'طلب الانضمام',
        emailExistsError: 'البريد الإلكتروني مستخدم بالفعل. يرجى استخدام بريد إلكتروني آخر.',
        nameLabel: 'الاسم',
        namePlaceholder: 'أدخل اسمك الكامل',
        nameRequired: 'الاسم مطلوب.',
        nameMinLength: 'الاسم يجب أن يحتوي على حرفين على الأقل.',
        nameMaxLength: 'الاسم يجب ألا يتجاوز 100 حرف.',
        namePattern: 'الاسم يجب أن يحتوي على أحرف عربية أو إنجليزية فقط.',
        nameOnlySpaces: 'الاسم لا يمكن أن يكون فراغات فقط.',
        emailLabel: 'البريد الإلكتروني',
        emailPlaceholder: 'example@domain.com',
        emailRequired: 'البريد الإلكتروني مطلوب.',
        emailInvalid: 'البريد الإلكتروني غير صالح.',
        phoneLabel: 'رقم الهاتف',
        phonePlaceholder: '0xxxxxxxxx',
        phoneRequired: 'رقم الهاتف مطلوب.',
        phonePattern: 'رقم الهاتف يجب أن يحتوي على 9-12 أرقام.',
        academicSpecializationLabel: 'التخصص الجامعي',
        academicSpecializationPlaceholder: 'مثال: هندسة الحاسوب',
        academicSpecializationRequired: 'التخصص الجامعي مطلوب.',
        academicSpecializationMinLength: 'التخصص يجب أن يحتوي على حرفين على الأقل.',
        academicSpecializationMaxLength: 'التخصص يجب ألا يتجاوز 100 حرف.',
        addressLabel: 'العنوان',
        addressPlaceholder: 'أدخل عنوانك الكامل',
        addressRequired: 'العنوان مطلوب.',
        addressMinLength: 'العنوان يجب أن يحتوي على 5 أحرف على الأقل.',
        addressMaxLength: 'العنوان يجب ألا يتجاوز 500 حرف.',
        submitButton: 'إرسال الطلب',
        submitting: 'جاري الإرسال...',
        successMessage: 'تم إرسال طلبك بنجاح!',
        pendingMessage: 'طلبك قيد المراجعة وسنتواصل معك خلال 48 ساعة.',
        formInvalid: 'يرجى تصحيح الأخطاء في النموذج',
        invalidData: 'البيانات المدخلة غير صالحة. يرجى المراجعة والمحاولة مرة أخرى.',
        serverError: 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.',
        networkError: 'لا يمكن الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.',
        unexpectedError: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
        invalidFormat: 'تنسيق غير صالح'
      },
      leaderboards: {
        heroTitle: 'لوحة الصدارة',
        heroDescription: 'اكتشف أفضل المتطوعين والقادة في منصتنا! انضم إلى صفوف المتميزين وساهم في تحقيق التغيير.',
        joinNow: 'انضم الآن',
        topLeaders: 'أفضل القادة',
        criteriaTitle: 'كن نجم التغيير!',
        criteriaDescription: 'انضم إلى مجتمعنا من المتطوعين والقادة المميزين، وساهم في بناء مستقبل مشرق! كل جهد تقدمه يصنع فارقًا ويقربك من القمة. ابدأ رحلتك الآن وكن جزءًا من التأثير الإيجابي!',
        contributeNow: 'ساهم الآن',
        topVolunteers: 'أفضل المتطوعين',
        remainingVolunteers: 'باقي تصنيفات المتطوعين',
        noUsers: 'لا يوجد مستخدمين في لوحة الصدارة',
        profileAlt: 'صورة الملف الشخصي',
        rankLabel: 'الرتبة',
        rankNotSpecified: 'غير محدد',
        scoreLabel: 'الدرجة',
        volunteerHoursLabel: 'ساعات التطوع',
        numberOfStudentsLabel: 'عدد الطلاب',
        subjectsLabel: 'المواد',
        noSubjects: 'لا توجد مواد',
        leaderType: 'قاده',
        volunteerType: 'متطوع',
        volunteerLabel: 'متطوع',
        errorLoadingLeaderboard: 'خطأ في تحميل لوحة الصدارة'
      },
      news: {
        latestNews: 'آخر',
        highlight: 'الأخبار',
        description: 'اعتمادنا في مؤسسات حكومية منها مؤسسة ولي العهد التي تضم منصة نحن الحاضنة للمبادرات التطوعية، وشراكات استراتيجية منها جهات موفدة للطلاب وداعمة ونطاقنا يشمل الأردن وفلسطين وإلى كُل طالب عِلم ومشاركتنا في كرنفالات على مستوى المملكة منها ملتقى التطوع الأردني 2024.',
        joinUs: 'انضم إلينا كمتطوع أو متبرع لدعم هذه الجهود الإنسانية.',
        newCategory: 'خبر جديد',
        item1: 'فتح باب الانضمام للفصل الدراسي الجديد.',
        item2: 'بدء العام الدراسي بتاريخ 24/08/2025.',
        item3: 'مشاركتنا في كرنفال عينك على المستقبل بتاريخ 13/08/2025.',
        readMore: '↑',
        viewAllNews: 'شاهد اخر الاخبار'
      },
      imageSection: {
        sectionBadge: 'معرض الصور',
        sectionTitle: 'ألبوم الصور الخاص بنا',
        sectionDescription: 'استعرض مجموعتنا من الصور التي تعكس جهودنا في دعم الأطفال ومرضى السرطان في غزة.',
        viewGallery: 'شاهد معرض الصور'
      },
      faq: {
        title: 'الأسئلة الشائعة',
        joinPrograms: 'كيف يمكنني الانضمام إلى البرامج التعليمية؟',
        joinProgramsAnswer: 'يمكنك ملء النموذج في صفحة الانضمام أو الاتصال بنا مباشرة.',
        volunteeringOpportunities: 'ما هي فرص التطوع المتاحة؟',
        volunteeringOpportunitiesAnswer: 'لدينا فرص في التدريس، الدعم الإداري، والأنشطة الترفيهية.',
        supportInitiative: 'كيف يمكنني دعم المبادرة؟',
        supportInitiativeAnswer: 'يمكنك التبرع، التطوع، أو نشر الوعي حول مبادراتنا.',
        workingHours: 'ما هي ساعات العمل؟',
        workingHoursAnswer: 'نحن متاحون من الساعة 8:00 صباحاً إلى 4:00 مساءً.'
      }
    },
    en: {
      nav: {
        home: 'Home',
        about: 'About Us',
        testimonials: 'Testimonials',
        library: 'Library',
        news: 'Latest News',
        joinUs: 'Join Us',
        leaderboards: 'Leaderboards',
        contact: 'Contact Us',
        dashboard: 'Dashboard',
        profile: 'Profile',
        login: 'Login',
        logout: 'Logout'
      },
      profile: {
        unauthorizedError: 'You are not authorized to access this page.',
        studentDataMismatch: 'Mismatch in student data. Please contact support.',
        loadError: 'Failed to load profile.',
        unexpectedError: 'An unexpected error occurred.',
        lowLectureWarning: 'Some students have low lecture counts.',
        lowLectureLoadError: 'Failed to load low lecture members.',
        fileSizeError: 'File size exceeds 10MB limit.',
        invalidImageType: 'Invalid image type. Please upload JPEG, PNG, GIF, or WebP.',
        pdfFileTypeError: 'Invalid file type. Please upload a PDF.',
        selectImageFirst: 'Please select an image to upload.',
        imageUploadSuccess: 'Profile image uploaded successfully.',
        imageUploadError: 'Failed to upload profile image.',
        fillAllFields: 'Please fill in all required fields.',
        selectPdfFile: 'Please select a PDF file to upload.',
        pdfRequestSuccess: 'PDF request submitted successfully.',
        pdfRequestError: 'Failed to submit PDF request.',
        passwordFieldsRequired: 'Both current and new passwords are required.',
        passwordChangeSuccess: 'Password changed successfully.',
        passwordChangeError: 'Failed to change password.',
        meetingFieldsRequired: 'All meeting fields are required.',
        meetingAddSuccess: 'Meeting added successfully.',
        meetingAddError: 'Failed to add meeting.',
        invalidMeetingId: 'Invalid meeting ID.',
        meetingDeleteSuccess: 'Meeting deleted successfully.',
        meetingDeleteError: 'Failed to delete meeting.',
        studentEmailNotFound: 'Student email not found.',
        validation: {
          subject: {
            invalid: 'Invalid subject selected.'
          }
        }
      },
      home: {
        heroTitle: 'Remote E-Learning Initiative',
        heroSubtitle: 'Qatrah Ghaith',
        heroDescription: 'Towards a better educational future for everyone',
        discoverMore: 'Discover More About Us',
        volunteer: 'Volunteer With Us',
        aboutUs: 'About Us',
        aboutTitle: 'About Us',
        aboutDescription: 'We are an educational charitable initiative founded in 2020 aimed at helping students who need special education and do not have the resources, by attracting university students or graduates to do the task.',
        achievements: 'Our Achievements',
        achievementsTitle: 'Achievements',
        achievementsDescription: 'Numbers that speak about our journey in education service',
        yearsExperience: 'Years Experience',
        activities: 'Activities & Services',
        volunteers: 'Volunteers',
        volunteerHours: 'Volunteer Hours',
        beneficiaries: 'Beneficiaries',
        helpSection: 'How to Help',
        joinToday: 'Join Us Today',
        helpDescription: 'Contribute to supporting our community through donation or joining our team.',
        donateContact: 'Contact Us for Donation',
        joinUs: 'Join Us',
        contactUs: 'Contact Us',
        contactTitle: 'Contact Us',
        contactDescription: 'We are happy to communicate with you to support our community initiatives.',
        contactInfo: 'Contact Information',
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        address: 'Amman',
        message: 'Your Message',
        send: 'Send',
        workingHours: 'We are available to respond to your inquiries from 8:00 AM to 4:00 PM',
        namePlaceholder: 'Enter your name',
        nameRequired: 'Name is required',
        nameMinLength: 'Name must be at least ${requiredLength} characters',
        nameMaxLength: 'Name must not exceed ${maxLength} characters',
        nameValid: 'Looks good!',
        emailPlaceholder: 'example@domain.com',
        emailRequired: 'Email is required',
        emailInvalid: 'Invalid email format',
        emailValid: 'Looks good!',
        phonePlaceholder: '07xxxxxxxx',
        phoneRequired: 'Phone is required',
        phonePattern: 'Invalid phone number',
        phoneValid: 'Looks good!',
        service: 'Service',
        selectService: 'Select Service',
        educationalPrograms: 'Educational Programs',
        volunteering: 'Volunteering',
        support: 'Support',
        partnership: 'Partnership',
        donation: 'Donation',
        other: 'Other',
        serviceRequired: 'Service is required',
        serviceValid: 'Looks good!',
        messagePlaceholder: 'Enter your message here',
        messageRequired: 'Message is required',
        messageMinLength: 'Message must be at least ${requiredLength} characters',
        messageMaxLength: 'Message must not exceed ${maxLength} characters',
        messageValid: 'Looks good!',
        charCount: 'Character Count',
        submitting: 'Submitting',
        clearForm: 'Clear Form',
        successMessage: 'Message sent successfully!',
        errorMessage: 'Error sending message',
        formInvalid: 'Please fill the form correctly',
        whatsappMessage: 'Hello, my name is ${name}, email ${email}, phone ${phone}, inquiring about ${service}: ${message}',
        followUs: 'Follow Us',
        socialMediaDescription: 'Stay updated with our latest news and events'
      },
      about: {
        introductionTitle: 'General Introduction to the Initiative',
        introductionDescription: 'We are an educational charitable initiative founded in 2020 aimed at helping students who need special education and lack the resources, by attracting university students or graduates to undertake the task. The initiative provides a remote learning environment to support all grades and subjects, as well as foundational education for those in need. Education is conducted online using applications like Zoom, Teams, and others, with live sessions recorded by volunteers and reviewed by specialists to ensure the success of the educational process.',
        imageAlt: 'Student engaged in learning',
        coverageTitle: 'Groups Covered by the Initiative',
        coverageOrphans: 'Orphans and Low-Income Individuals',
        coverageOrphansAlt: 'Orphans and Low-Income Individuals',
        coverageChronic: 'Patients with Chronic Diseases',
        coverageChronicAlt: 'Cancer Patients',
        coverageGaza: 'Gaza City Students',
        coverageGazaAlt: 'Gaza City Students',
        valuesTitle: 'Our Values, Mission, and Goals',
        goalsTitle: 'Our Goals',
        goalsDescription: 'We aim to "be a role model" in hard work and commitment',
        missionTitle: 'Our Mission',
        missionDescription: 'We focus on developing skills and enhancing the capabilities of youth',
        valuesCardTitle: 'Our Values',
        valuesDescription: 'We work to boost students\' confidence and promote a culture of volunteering',
        accreditationTitle: 'Initiative Accreditation',
        accreditationSubtitle: 'The initiative is accredited on the Nahn platform as an official initiative. This accreditation provides volunteers with numerous important benefits and advantages.',
        accreditationBadgeTitle: 'Accredited Initiative',
        accreditationBadgeSubtitle: 'Official Nahn Platform',
        benefitsTitle: 'Accreditation Benefits for Volunteers',
        benefitVolunteerHoursTitle: 'Accreditation of Volunteer Hours',
        benefitVolunteerHoursDescription: 'Accreditation of volunteer hours as community service for volunteers within the Hashemite Kingdom of Jordan',
        benefitAcademicPointsTitle: 'Academic Points',
        benefitAcademicPointsDescription: 'Earning points for the community service course at universities',
        benefitGrantsPointsTitle: 'Additional Points for Grants',
        benefitGrantsPointsDescription: 'Additional points for external grants provided by governments',
        benefitCertificatesTitle: 'Accredited Certificates',
        benefitCertificatesDescription: 'Obtaining accredited certificates from the Nahn platform for volunteers',
        partnersTitle: 'Partnerships and Accreditations',
        partnersSubtitle: 'We are proud of our partnerships with respected institutions and entities that contribute to supporting our educational and volunteering mission',
        partnerCrownPrince: 'Crown Prince Foundation',
        partnerCrownPrinceAlt: 'Crown Prince Foundation Logo',
        partnerNamaa: 'Namaa Association',
        partnerNamaaAlt: 'Namaa Association Logo',
        partner180: '180 Foundation',
        partner180Alt: '180 Foundation Logo',
        partnerJoAcademy: 'Jo Academy',
        partnerJoAcademyAlt: 'Jo Academy Logo',
        partnerNahn: 'Nahn Platform',
        partnerNahnAlt: 'Nahn Platform Logo',
        trustVerified: 'Verified and Accredited Partnerships',
        trustPartners: 'More than 5 Strategic Partners',
        trustSupport: 'Continuous Support for the Initiative',
        volunteerTitle: 'Join Us',
        volunteerButton: 'Volunteer With Us'
      },
      testimonials: {
        heroTitle: 'Beneficiaries\' Testimonials',
        heroDescription: 'We build a nation to revive a nation, free from illiteracy, to create a civilization',
        viewAllButton: 'View All Testimonials',
        valueExperience: 'Experience',
        valueLearning: 'Learning',
        valueHumanity: 'Humanity',
        profileAlt: 'Profile Picture',
        placeholderText: '...',
        noTestimonials: 'No testimonials available at the moment',
        errorDefault: 'Error fetching testimonials'
      },
      library: {
        title: 'PDF Files Library',
        clearSearch: 'Clear Search',
        searchPlaceholder: 'Search by titles...',
        allSubjects: 'All Subjects',
        allCreators: 'All Creators',
        allAcademicLevels: 'All Academic Levels',
        allCountries: 'All Countries',
        fileNameLabel: 'File Name:',
        createdAtLabel: 'Upload Date:',
        openFile: 'Open File',
        share: 'Share',
        noPdfs: 'No PDF files available to display',
        noResults: 'No results match the selected search criteria',
        errorLoadingPdfs: 'An error occurred while loading the files',
        invalidId: 'Invalid file ID',
        popupBlocked: 'Failed to open the file. Please allow pop-ups',
        fileOpened: 'File opened successfully',
        errorOpeningFile: 'An error occurred while opening the file',
        errorLoadingFile: 'Failed to load the file',
        linkCopied: 'Share link copied successfully',
        copyFailed: 'Failed to copy the link. Please copy manually'
      },
      gallery: {
        title: 'Image Gallery',
        subtitle: 'Inspiring images from our educational and charitable initiative, dedicated to teaching and providing educational activities for every student, through the participation of volunteers specialized in education, psychological support, and administration.',
        sectionBadge: 'Image Gallery',
        sectionTitle: 'Our Photo Album',
        sectionDescription: 'Browse our collection of images reflecting our efforts in supporting children and cancer patients in Gaza.',
        viewGallery: 'View Image Gallery',
        featuredActivities: 'Featured Activities',
        latestEvents: 'Latest Events',
        latestEventsDescription: 'Educational and motivational activities with our students at Namaa Charitable Association and live snapshots from free support classes, recreational, and educational activities.',
        impactfulActivities: 'Impactful Activities',
        impactfulActivitiesDescription: 'Snapshots from the most impactful events, highlighting the importance of education and psychological support.',
        humanitarianMessage: 'Humanitarian and Educational Message',
        humanitarianMessageDescription1: 'These images showcase the efforts of our educational volunteer initiative in providing a safe and motivating learning environment for our students through dedicated teachers, volunteers, and administrators who contribute their time and effort for a better future.',
        humanitarianMessageDescription2: 'Each image tells a story of hope, reflecting the strength of teamwork and the spirit of giving to help others.',
        allImages: 'All Images',
        allImagesDescription: 'Here is our comprehensive collection of images documenting our journey in supporting education for every student.',
        errorLoadingImages: 'Failed to load gallery images'
      },
      joinUs: {
        welcomeTitle: 'Welcome!',
        welcomeSubtitle: 'Join us and the foundation to be part of our initiatives. We are here to build a brighter future together!',
        formTitle: 'Join Request',
        emailExistsError: 'The email is already in use. Please use a different email.',
        nameLabel: 'Name',
        namePlaceholder: 'Enter your full name',
        nameRequired: 'Name is required.',
        nameMinLength: 'Name must be at least 2 characters long.',
        nameMaxLength: 'Name must not exceed 100 characters.',
        namePattern: 'Name must contain only Arabic or English letters.',
        nameOnlySpaces: 'Name cannot consist of only spaces.',
        emailLabel: 'Email',
        emailPlaceholder: 'example@domain.com',
        emailRequired: 'Email is required.',
        emailInvalid: 'Email is invalid.',
        phoneLabel: 'Phone Number',
        phonePlaceholder: '0xxxxxxxxx',
        phoneRequired: 'Phone number is required.',
        phonePattern: 'Phone number must contain 9-12 digits.',
        academicSpecializationLabel: 'Academic Specialization',
        academicSpecializationPlaceholder: 'Example: Computer Engineering',
        academicSpecializationRequired: 'Academic specialization is required.',
        academicSpecializationMinLength: 'Academic specialization must be at least 2 characters long.',
        academicSpecializationMaxLength: 'Academic specialization must not exceed 100 characters.',
        addressLabel: 'Address',
        addressPlaceholder: 'Enter your full address',
        addressRequired: 'Address is required.',
        addressMinLength: 'Address must be at least 5 characters long.',
        addressMaxLength: 'Address must not exceed 500 characters.',
        submitButton: 'Submit Request',
        submitting: 'Submitting...',
        successMessage: 'Your request has been submitted successfully!',
        pendingMessage: 'Your request is under review, and we will contact you within 48 hours.',
        formInvalid: 'Please correct the errors in the form.',
        invalidData: 'The entered data is invalid. Please review and try again.',
        serverError: 'A server error occurred. Please try again later.',
        networkError: 'Unable to connect to the server. Please check your internet connection.',
        unexpectedError: 'An unexpected error occurred. Please try again.',
        invalidFormat: 'Invalid format'
      },
      leaderboards: {
        heroTitle: 'Leaderboard',
        heroDescription: 'Discover the top volunteers and leaders on our platform! Join the ranks of the distinguished and contribute to making a change.',
        joinNow: 'Join Now',
        topLeaders: 'Top Leaders',
        criteriaTitle: 'Be a Star of Change!',
        criteriaDescription: 'Join our community of distinguished volunteers and leaders, and contribute to building a bright future! Every effort you make makes a difference and brings you closer to the top. Start your journey now and be part of the positive impact!',
        contributeNow: 'Contribute Now',
        topVolunteers: 'Top Volunteers',
        remainingVolunteers: 'Remaining Volunteer Rankings',
        noUsers: 'No users are currently on the leaderboard',
        profileAlt: 'Profile Picture',
        rankLabel: 'Rank',
        rankNotSpecified: 'Not specified',
        scoreLabel: 'Score',
        volunteerHoursLabel: 'Volunteer Hours',
        numberOfStudentsLabel: 'Number of Students',
        subjectsLabel: 'Subjects',
        noSubjects: 'No subjects',
        leaderType: 'Leader',
        volunteerType: 'Volunteer',
        volunteerLabel: 'Volunteer',
        errorLoadingLeaderboard: 'Error loading leaderboard'
      },
      news: {
        latestNews: 'Latest',
        highlight: 'News',
        description: 'We are accredited by governmental institutions, including the Crown Prince Foundation, which includes the Nahn platform, the incubator for volunteer initiatives, and strategic partnerships with entities sponsoring and supporting students. Our scope includes Jordan and Palestine, reaching every knowledge-seeking student. We participate in festivals across the kingdom, including the Jordan Volunteer Forum 2024.',
        joinUs: 'Join us as a volunteer or donor to support these humanitarian efforts.',
        newCategory: 'New',
        item1: 'Opening registration for the new academic semester.',
        item2: 'Start of the academic year on 24/08/2025.',
        item3: 'Our participation in the "Eye on the Future" carnival on 13/08/2025.',
        readMore: '↑',
        viewAllNews: 'View All News'
      },
      imageSection: {
        sectionBadge: 'Image Gallery',
        sectionTitle: 'Our Photo Album',
        sectionDescription: 'Browse our collection of images reflecting our efforts in supporting children and cancer patients in Gaza.',
        viewGallery: 'View Image Gallery'
      },
      faq: {
        title: 'Frequently Asked Questions',
        joinPrograms: 'How can I join the educational programs?',
        joinProgramsAnswer: 'You can fill out the form on the join us page or contact us directly.',
        volunteeringOpportunities: 'What volunteering opportunities are available?',
        volunteeringOpportunitiesAnswer: 'We offer opportunities in teaching, administrative support, and recreational activities.',
        supportInitiative: 'How can I support the initiative?',
        supportInitiativeAnswer: 'You can donate, volunteer, or spread awareness about our initiatives.',
        workingHours: 'What are the working hours?',
        workingHoursAnswer: 'We are available from 8:00 AM to 4:00 PM.'
      }
    }
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      const savedLanguage = localStorage.getItem('selectedLanguage') || 'ar';
      this.currentLanguageSubject.next(savedLanguage);
      this.updateBodyDirection(savedLanguage);
    }
  }

  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  setLanguage(language: string): void {
    if (['ar', 'en'].includes(language)) {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('selectedLanguage', language);
        this.updateBodyDirection(language);
      }
      this.currentLanguageSubject.next(language);
    } else {
      this.setLanguage('ar');
    }
  }

  translate(key: string): string {
    if (!key) {
      return '';
    }

    const language = this.getCurrentLanguage();
    if (!this.translations[language as keyof Translations]) {
      return '';
    }

    const keys = key.split('.');
    let current: any = this.translations[language as keyof Translations];

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return '';
      }
    }

    if (typeof current !== 'string') {
      return '';
    }

    return current;
  }

  private updateBodyDirection(language: string): void {
    if (isPlatformBrowser(this.platformId)) {
      const body = document.body;
      const html = document.documentElement;

      if (language === 'ar') {
        body.setAttribute('dir', 'rtl');
        html.setAttribute('dir', 'rtl');
        html.setAttribute('lang', 'ar');
      } else {
        body.setAttribute('dir', 'ltr');
        html.setAttribute('dir', 'ltr');
        html.setAttribute('lang', 'en');
      }
    }
  }

  isRtl(): boolean {
    return this.getCurrentLanguage() === 'ar';
  }
}
