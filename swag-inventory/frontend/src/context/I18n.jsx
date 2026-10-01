import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const en = {
  appName: 'Inventory', brand: 'Swag Group', loginTitle: 'Inventory Control Center',
  loginSub: 'Sign in with the account your administrator created for you.',
  signIn: 'Sign in', signingIn: 'Signing in…', email: 'Email', password: 'Password',
  // menus
  overview: 'Overview', branches: 'Branches', assets: 'Assets', requests: 'Requests', attention: 'Needs Attention',
  analytics: 'Analytics', users: 'Users', settings: 'Settings',
  // common
  search: 'Search…', searchAssets: 'Search assets…', refresh: 'Refresh', scan: 'Scan', export: 'Export', import: 'Import',
  signout: 'Sign out', theme: 'Theme', close: 'Close', cancel: 'Cancel', save: 'Save', delete: 'Delete', edit: 'Edit',
  view: 'View', qr: 'QR', print: 'Print', download: 'Download', add: 'Add', addAsset: 'New Asset', all: 'All',
  noData: 'Nothing here yet', confirm: 'Confirm', actions: 'Actions', results: 'results', select: 'Select…',
  selected: 'selected', saved: 'saved', deleted: 'Deleted', you: 'you', lastSync: 'Last sync', alerts: 'Alerts',
  noAlerts: 'All good — no alerts', fillRequired: 'Please fill all required fields', notFound: 'Not found or not available to you',
  // asset fields
  name: 'Name', branch: 'Branch', category: 'Category', model: 'Model', status: 'Status', color: 'Color', qty: 'Qty',
  serial: 'Serial number', amount: 'Amount (SAR)', total: 'Total value', invoice: 'Invoice #', purchaseDate: 'Purchase date',
  created: 'Created', notes: 'Notes', photo: 'Photo', namePh: 'e.g. Cashier Computer',
  // stats
  s_branches: 'Branches', s_types: 'Asset Types', s_units: 'Total Units', s_inuse: 'In Use', s_value: 'Total Value (SAR)',
  s_cats: 'Categories', k_maint: 'Under Maintenance', k_damaged: 'Damaged', k_storage: 'In Storage', k_util: 'Utilization Rate',
  topBranches: 'Top Branches by Units', viewAll: 'View all', recent: 'Recent Assets', units: 'units', types: 'types', lastEntry: 'Last entry',
  // filters
  allBranches: 'All Branches', allCategories: 'All Categories', allStatus: 'All Status', advFilters: 'Filters', clear: 'Clear',
  dateFrom: 'Created from', dateTo: 'Created to', amtMin: 'Amount min', amtMax: 'Amount max', listView: 'List', kanbanView: 'Kanban',
  st_use: 'In use', st_avail: 'Available', st_store: 'In storage', st_fix: 'Needs maintenance', st_stop: 'Damaged',
  printLabels: 'Print QR labels',
  // asset dialogs
  assetDetails: 'Asset Details', editAsset: 'Edit Asset', newAsset: 'New Asset', uploadPhoto: 'Click to upload',
  takePhoto: 'Take photo', removePhoto: 'Remove photo', history: 'Activity', noHistory: 'No activity yet',
  deleteAssetQ: 'Delete this asset?', cannotUndo: 'This cannot be undone.',
  h_created: 'Created', h_updated: 'Updated', h_photo: 'Photo', h_request: 'Request', h_transfer: 'Transferred',
  importQ: 'rows found. Import them now?', importEmpty: 'No rows found in this file', imported: 'assets imported',
  // requests
  request: 'Request transfer', sendRequest: 'Send request', toBranch: 'Move to branch (yours)', note: 'Note (optional)',
  incoming: 'Incoming', myRequests: 'My requests', approve: 'Approve', reject: 'Reject', cancelReq: 'Cancel request',
  pending: 'Pending', completed: 'Transferred', rejected: 'Rejected', cancelled: 'Cancelled', reserved: 'Reserved (open request)',
  reqSent: 'Request sent', noRequests: 'No requests yet', noTargetBranch: 'You have no other branch to move this item into.',
  // attention
  attTitle: 'Needs Attention', noPhoto: 'Missing photo', noPrice: 'Missing price', noStatus: 'Missing status',
  dupes: 'Same item in 2+ branches', allGood: 'Everything looks good',
  // analytics
  c_branch: 'Units by branch', c_cat: 'By category', c_status: 'By status', c_brand: 'By brand', c_value: 'Value by branch (SAR)',
  // alerts
  n_requests: 'incoming transfer requests', n_damaged: 'damaged assets', n_maint: 'assets need maintenance',
  n_nostatus: 'assets without status', n_nophoto: 'assets without photo',
  // users
  newUser: 'New User', role: 'Role', role_admin: 'Admin', role_editor: 'Editor', role_viewer: 'Viewer',
  roleDesc_admin: 'Everything: all branches, users and settings.',
  roleDesc_editor: 'Add, edit, delete and approve transfers in assigned branches.',
  roleDesc_viewer: 'Read-only in assigned branches; can request transfers.',
  branchesAccess: 'Branch access', allBranchesAccess: 'All branches', noBranches: 'No branches',
  noBranchesWarn: 'With no branch selected this user will see nothing.', active: 'Active', inactive: 'Disabled',
  activeDesc: 'Account active (untick to block sign-in)', resetPassword: 'New password', keepPassword: 'Leave empty to keep the current password',
  userCreated: 'User created', deleteUserQ: 'Delete this user?', min6: 'At least 6 characters',
  // settings
  manageBranches: 'Branches', branchName: 'Branch name', brandName: 'Brand', branchHint: 'Branches appear in every dropdown. A branch with assets cannot be deleted.',
  manageChoices: 'Dropdown options', choiceHint: 'Options shown when adding or editing an asset.', addOption: 'New option…',
  kind_category: 'Categories', kind_status: 'Statuses', kind_color: 'Colors',
  // account / scanner
  changePassword: 'Change password', currentPassword: 'Current password', newPassword: 'New password', passwordChanged: 'Password changed',
  scanTitle: 'Scan asset QR', scanHint: 'Point the camera at an asset QR code.', cameraError: 'Camera not available — allow camera access and use HTTPS',
  notRecognized: 'QR code not recognized',
}

const ar = {
  appName: 'المخزون', brand: 'مجموعة سواج', loginTitle: 'مركز التحكم بالمخزون',
  loginSub: 'سجّل الدخول بالحساب الذي أنشأه لك المسؤول.',
  signIn: 'تسجيل الدخول', signingIn: 'جارٍ الدخول…', email: 'البريد الإلكتروني', password: 'كلمة المرور',
  overview: 'نظرة عامة', branches: 'الفروع', assets: 'الأصول', requests: 'الطلبات', attention: 'بحاجة لمراجعة',
  analytics: 'التحليلات', users: 'المستخدمون', settings: 'الإعدادات',
  search: 'بحث…', searchAssets: 'ابحث في الأصول…', refresh: 'تحديث', scan: 'مسح', export: 'تصدير', import: 'استيراد',
  signout: 'تسجيل الخروج', theme: 'المظهر', close: 'إغلاق', cancel: 'إلغاء', save: 'حفظ', delete: 'حذف', edit: 'تعديل',
  view: 'عرض', qr: 'QR', print: 'طباعة', download: 'تنزيل', add: 'إضافة', addAsset: 'أصل جديد', all: 'الكل',
  noData: 'لا توجد بيانات بعد', confirm: 'تأكيد', actions: 'إجراءات', results: 'نتيجة', select: 'اختر…',
  selected: 'محدد', saved: 'تم الحفظ', deleted: 'تم الحذف', you: 'أنت', lastSync: 'آخر مزامنة', alerts: 'التنبيهات',
  noAlerts: 'كل شيء على ما يرام', fillRequired: 'يرجى تعبئة الحقول المطلوبة', notFound: 'غير موجود أو غير متاح لك',
  name: 'الاسم', branch: 'الفرع', category: 'الفئة', model: 'الموديل', status: 'الحالة', color: 'اللون', qty: 'الكمية',
  serial: 'الرقم التسلسلي', amount: 'المبلغ (ريال)', total: 'القيمة الإجمالية', invoice: 'رقم الفاتورة', purchaseDate: 'تاريخ الشراء',
  created: 'تاريخ الإضافة', notes: 'ملاحظات', photo: 'صورة', namePh: 'مثال: كمبيوتر الكاشير',
  s_branches: 'الفروع', s_types: 'أنواع الأصول', s_units: 'إجمالي الوحدات', s_inuse: 'قيد الاستخدام', s_value: 'القيمة الإجمالية (ريال)',
  s_cats: 'الفئات', k_maint: 'تحت الصيانة', k_damaged: 'تالف', k_storage: 'في المخزن', k_util: 'معدل الاستخدام',
  topBranches: 'أعلى الفروع بالوحدات', viewAll: 'عرض الكل', recent: 'أحدث الأصول', units: 'وحدة', types: 'نوع', lastEntry: 'آخر إضافة',
  allBranches: 'كل الفروع', allCategories: 'كل الفئات', allStatus: 'كل الحالات', advFilters: 'فلاتر', clear: 'مسح',
  dateFrom: 'من تاريخ', dateTo: 'إلى تاريخ', amtMin: 'أقل مبلغ', amtMax: 'أعلى مبلغ', listView: 'قائمة', kanbanView: 'بطاقات',
  st_use: 'قيد الاستخدام', st_avail: 'متاح', st_store: 'في المخزن', st_fix: 'يحتاج صيانة', st_stop: 'تالف',
  printLabels: 'طباعة ملصقات QR',
  assetDetails: 'تفاصيل الأصل', editAsset: 'تعديل الأصل', newAsset: 'أصل جديد', uploadPhoto: 'اضغط للرفع',
  takePhoto: 'التقاط صورة', removePhoto: 'إزالة الصورة', history: 'سجل النشاط', noHistory: 'لا يوجد نشاط بعد',
  deleteAssetQ: 'حذف هذا الأصل؟', cannotUndo: 'لا يمكن التراجع عن هذا الإجراء.',
  h_created: 'تمت الإضافة', h_updated: 'تم التعديل', h_photo: 'الصورة', h_request: 'طلب', h_transfer: 'تم النقل',
  importQ: 'صف. هل تريد الاستيراد الآن؟', importEmpty: 'لا توجد صفوف في هذا الملف', imported: 'أصل تم استيراده',
  request: 'طلب نقل', sendRequest: 'إرسال الطلب', toBranch: 'النقل إلى فرع (فرعك)', note: 'ملاحظة (اختياري)',
  incoming: 'الواردة', myRequests: 'طلباتي', approve: 'موافقة', reject: 'رفض', cancelReq: 'إلغاء الطلب',
  pending: 'قيد الانتظار', completed: 'تم النقل', rejected: 'مرفوض', cancelled: 'ملغى', reserved: 'محجوز (طلب مفتوح)',
  reqSent: 'تم إرسال الطلب', noRequests: 'لا توجد طلبات', noTargetBranch: 'لا يوجد لديك فرع آخر لنقل هذه القطعة إليه.',
  attTitle: 'بحاجة لمراجعة', noPhoto: 'بدون صورة', noPrice: 'بدون سعر', noStatus: 'بدون حالة',
  dupes: 'نفس القطعة في فرعين أو أكثر', allGood: 'كل شيء على ما يرام',
  c_branch: 'الوحدات حسب الفرع', c_cat: 'حسب الفئة', c_status: 'حسب الحالة', c_brand: 'حسب العلامة', c_value: 'القيمة حسب الفرع (ريال)',
  n_requests: 'طلبات نقل واردة', n_damaged: 'أصول تالفة', n_maint: 'أصول تحتاج صيانة', n_nostatus: 'أصول بدون حالة', n_nophoto: 'أصول بدون صورة',
  newUser: 'مستخدم جديد', role: 'الدور', role_admin: 'مسؤول', role_editor: 'محرر', role_viewer: 'مشاهد',
  roleDesc_admin: 'كل شيء: جميع الفروع والمستخدمين والإعدادات.',
  roleDesc_editor: 'إضافة وتعديل وحذف والموافقة على النقل في الفروع المحددة.',
  roleDesc_viewer: 'عرض فقط في الفروع المحددة، ويمكنه طلب النقل.',
  branchesAccess: 'صلاحية الفروع', allBranchesAccess: 'كل الفروع', noBranches: 'بدون فروع',
  noBranchesWarn: 'بدون اختيار فرع لن يرى هذا المستخدم أي شيء.', active: 'نشط', inactive: 'معطّل',
  activeDesc: 'الحساب نشط (أزل التحديد لمنع الدخول)', resetPassword: 'كلمة مرور جديدة', keepPassword: 'اتركه فارغاً للإبقاء على كلمة المرور الحالية',
  userCreated: 'تم إنشاء المستخدم', deleteUserQ: 'حذف هذا المستخدم؟', min6: '6 أحرف على الأقل',
  manageBranches: 'الفروع', branchName: 'اسم الفرع', brandName: 'العلامة', branchHint: 'تظهر الفروع في كل القوائم. لا يمكن حذف فرع يحتوي على أصول.',
  manageChoices: 'خيارات القوائم', choiceHint: 'الخيارات التي تظهر عند إضافة أو تعديل أصل.', addOption: 'خيار جديد…',
  kind_category: 'الفئات', kind_status: 'الحالات', kind_color: 'الألوان',
  changePassword: 'تغيير كلمة المرور', currentPassword: 'كلمة المرور الحالية', newPassword: 'كلمة المرور الجديدة', passwordChanged: 'تم تغيير كلمة المرور',
  scanTitle: 'مسح رمز QR', scanHint: 'وجّه الكاميرا نحو رمز QR الخاص بالأصل.', cameraError: 'الكاميرا غير متاحة — اسمح بالوصول واستخدم HTTPS',
  notRecognized: 'لم يتم التعرف على الرمز',
}

export const DICT = { en, ar }
const I18nCtx = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => { try { return localStorage.getItem('inv_lang') || 'en' } catch (_) { return 'en' } })
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    try { localStorage.setItem('inv_lang', lang) } catch (_) {}
  }, [lang])
  const t = useCallback((k) => DICT[lang][k] ?? en[k] ?? k, [lang])
  const toggleLang = useCallback(() => setLang((l) => (l === 'ar' ? 'en' : 'ar')), [])
  return <I18nCtx.Provider value={{ lang, t, toggleLang }}>{children}</I18nCtx.Provider>
}
export const useI18n = () => useContext(I18nCtx)
