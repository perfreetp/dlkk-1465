import type { Question, PatientType, EnhanceMRIInfo, FeedbackItem } from '@/types/mri';

export const questions: Question[] = [
  {
    id: 'q1',
    title: '您体内有钢板或螺钉吗？',
    description: '比如骨折手术植入的固定物，包括钛合金和不锈钢材质的',
    category: '金属植入物',
    icon: '🔧',
    options: [
      { label: '没有', value: 'no', riskLevel: 'low', detail: '无此类植入物' },
      { label: '有，不确定材质', value: 'unknown', riskLevel: 'medium', detail: '需要确认植入物材质是否为MRI兼容' },
      { label: '有，是不锈钢的', value: 'steel', riskLevel: 'high', detail: '不锈钢植入物通常不能做MRI' },
      { label: '有，是钛合金的', value: 'titanium', riskLevel: 'low', detail: '钛合金植入物通常兼容MRI，但需携带证明' },
    ],
  },
  {
    id: 'q2',
    title: '您有心脏支架吗？',
    description: '冠脉支架、外周血管支架等',
    category: '金属植入物',
    icon: '❤️',
    options: [
      { label: '没有', value: 'no', riskLevel: 'low', detail: '无此类植入物' },
      { label: '有，6周以内放的', value: 'recent', riskLevel: 'high', detail: '新植入支架（6周内）禁止做MRI' },
      { label: '有，超过6周了', value: 'old', riskLevel: 'medium', detail: '需携带支架型号证明，由医生评估' },
    ],
  },
  {
    id: 'q3',
    title: '您佩戴助听设备吗？',
    description: '助听器、人工耳蜗等',
    category: '电子设备',
    icon: '👂',
    options: [
      { label: '没有', value: 'no', riskLevel: 'low', detail: '无此类设备' },
      { label: '有助听器', value: 'hearingAid', riskLevel: 'medium', detail: '助听器检查前需取下，部分型号需咨询医生' },
      { label: '有人工耳蜗', value: 'cochlear', riskLevel: 'high', detail: '人工耳蜗通常不能做MRI，需咨询医生' },
    ],
  },
  {
    id: 'q4',
    title: '您有纹身或永久化妆吗？',
    description: '包括纹眉、纹眼线等',
    category: '其他',
    icon: '🎨',
    options: [
      { label: '没有', value: 'no', riskLevel: 'low', detail: '无纹身' },
      { label: '有，面积较小', value: 'small', riskLevel: 'low', detail: '小面积纹身一般可以检查，检查时可能感到轻微发热' },
      { label: '有，大面积纹身', value: 'large', riskLevel: 'medium', detail: '大面积纹身需告知医生，检查时可能发热不适' },
    ],
  },
  {
    id: 'q5',
    title: '您有金属牙套或种植牙吗？',
    description: '正畸牙套、金属烤瓷牙、种植牙等',
    category: '金属植入物',
    icon: '🦷',
    options: [
      { label: '没有', value: 'no', riskLevel: 'low', detail: '无此类情况' },
      { label: '有金属牙套', value: 'braces', riskLevel: 'medium', detail: '金属牙套可能影响头部MRI成像质量' },
      { label: '有种植牙', value: 'implant', riskLevel: 'low', detail: '现代种植牙通常兼容MRI' },
      { label: '有烤瓷牙', value: 'porcelain', riskLevel: 'medium', detail: '部分金属基底烤瓷牙需咨询医生' },
    ],
  },
  {
    id: 'q6',
    title: '您体内有过其他金属异物吗？',
    description: '如弹片、金属碎屑、旧式手术夹等',
    category: '异物史',
    icon: '⚡',
    options: [
      { label: '没有', value: 'no', riskLevel: 'low', detail: '无异物史' },
      { label: '有，不确定具体是什么', value: 'uncertain', riskLevel: 'high', detail: '不明金属异物禁止MRI，需先拍X光确认' },
      { label: '有，是手术夹/吻合器', value: 'clip', riskLevel: 'medium', detail: '需确认手术夹型号和材质' },
      { label: '有弹片/金属碎屑', value: 'shrapnel', riskLevel: 'high', detail: '弹片类异物严禁MRI检查' },
    ],
  },
];

export const patientTypes: PatientType[] = [
  {
    type: 'normal',
    label: '普通成人',
    reminders: [],
  },
  {
    type: 'child',
    label: '儿童',
    reminders: [
      '儿童检查需要家长全程陪同',
      '年龄较小的儿童可能需要镇静，请提前咨询',
      '请携带儿童的既往检查资料',
    ],
  },
  {
    type: 'pregnant',
    label: '孕妇',
    reminders: [
      '孕早期（前3个月）一般不建议做MRI，除非医生特别要求',
      '增强MRI使用的造影剂可能影响胎儿，请务必告知医生怀孕情况',
      '检查前请与产科医生充分沟通',
    ],
  },
  {
    type: 'postSurgery',
    label: '术后患者',
    reminders: [
      '术后体内可能有引流管、吻合器等，请确认是否为MRI兼容材质',
      '请携带手术记录和植入物证明',
      '伤口未愈合时请告知医生',
    ],
  },
  {
    type: 'elderly',
    label: '老年人',
    reminders: [
      '建议家属陪同前往检查',
      '检查时间较长（20-60分钟），请提前评估耐受力',
      '如有幽闭恐惧症，请提前告知医生',
    ],
  },
];

export const enhanceMRIInfo: EnhanceMRIInfo = {
  bloodTestRequired: true,
  dietRequirement: '检查前4小时禁食，可少量饮水',
  companionRequired: true,
  contrastType: '钆造影剂',
};

export const feedbackQuestions: FeedbackItem[] = [
  {
    id: 'f1',
    question: '医护人员的沟通是否清楚？',
    type: 'rating',
  },
  {
    id: 'f2',
    question: '等待时间是否过长？',
    type: 'choice',
    options: ['很快', '正常', '偏长', '太长'],
  },
  {
    id: 'f3',
    question: '您对本次检查体验的整体评价？',
    type: 'rating',
  },
];

export const implantExamples = [
  {
    name: '心脏起搏器',
    description: '通常禁止做MRI，除非是MRI兼容型号',
    imageId: 'https://picsum.photos/id/160/200/200',
    riskLevel: 'high' as const,
  },
  {
    name: '人工关节',
    description: '钛合金材质通常可以，需携带证明',
    imageId: 'https://picsum.photos/id/119/200/200',
    riskLevel: 'medium' as const,
  },
  {
    name: '冠脉支架',
    description: '新植入需等待6周以上，需携带型号证明',
    imageId: 'https://picsum.photos/id/2/200/200',
    riskLevel: 'medium' as const,
  },
  {
    name: '人工耳蜗',
    description: '多数型号禁止MRI，极少数兼容',
    imageId: 'https://picsum.photos/id/9/200/200',
    riskLevel: 'high' as const,
  },
  {
    name: '动脉瘤夹',
    description: '取决于材质，必须确认型号',
    imageId: 'https://picsum.photos/id/3/200/200',
    riskLevel: 'high' as const,
  },
  {
    name: '输液港/Port',
    description: '需确认材质，多数可以检查',
    imageId: 'https://picsum.photos/id/8/200/200',
    riskLevel: 'medium' as const,
  },
];

export const appointmentData = {
  id: 'MRI20260617001',
  patientName: '张三',
  examType: '头颅MRI平扫+增强',
  examDate: '2026-06-20',
  examTime: '09:30',
  department: '影像科',
  location: '3号楼1层 MRI室2号机房',
  checkInCode: 'MRI-8C3K9',
  checklist: [
    { id: 'c1', text: '携带身份证和医保卡', checked: false },
    { id: 'c2', text: '携带既往片子（如有）', checked: false },
    { id: 'c3', text: '携带植入物证明（如有）', checked: false },
    { id: 'c4', text: '增强检查需4小时禁食', checked: false },
    { id: 'c5', text: '检查当天不化妆、不涂指甲油', checked: false },
    { id: 'c6', text: '提前取下所有金属饰品', checked: false },
    { id: 'c7', text: '穿着无金属扣的宽松衣物', checked: false },
  ],
  timeline: [
    { time: '09:00', title: '到达医院', description: '建议提前30分钟到达', completed: false },
    { time: '09:10', title: '窗口签到', description: '出示核验码完成签到', completed: false },
    { time: '09:15', title: '更衣准备', description: '取下饰品、更换检查服', completed: false },
    { time: '09:30', title: 'MRI检查', description: '检查时间约30-45分钟', completed: false },
    { time: '10:15', title: '检查结束', description: '到休息区观察15分钟', completed: false },
    { time: '10:30', title: '离院', description: '增强检查后需多饮水', completed: false },
  ],
};
