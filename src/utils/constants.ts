import { SchoolType, Grade, AdditionalFeeType } from '../types';

export const SCHOOL_TYPE_LABELS = {
  [SchoolType.ELEMENTARY]: 'ابتدائي',
  [SchoolType.MIDDLE]: 'متوسط',
  [SchoolType.HIGH]: 'إعدادي'
};

export const ADDITIONAL_FEE_TYPE_LABELS = {
  [AdditionalFeeType.REGISTRATION]: 'رسوم التسجيل',
  [AdditionalFeeType.UNIFORM]: 'الزي المدرسي',
  [AdditionalFeeType.BOOKS]: 'الكتب',
  [AdditionalFeeType.CUSTOM]: 'رسوم مخصصة'
};

export const GRADES: Grade[] = [
  // ابتدائي
  { value: 'first_elementary', label: 'الصف الأول ابتدائي', schoolType: SchoolType.ELEMENTARY },
  { value: 'second_elementary', label: 'الصف الثاني ابتدائي', schoolType: SchoolType.ELEMENTARY },
  { value: 'third_elementary', label: 'الصف الثالث ابتدائي', schoolType: SchoolType.ELEMENTARY },
  { value: 'fourth_elementary', label: 'الصف الرابع ابتدائي', schoolType: SchoolType.ELEMENTARY },
  { value: 'fifth_elementary', label: 'الصف الخامس ابتدائي', schoolType: SchoolType.ELEMENTARY },
  { value: 'sixth_elementary', label: 'الصف السادس ابتدائي', schoolType: SchoolType.ELEMENTARY },
  
  // متوسط
  { value: 'first_middle', label: 'الصف الأول متوسط', schoolType: SchoolType.MIDDLE },
  { value: 'second_middle', label: 'الصف الثاني متوسط', schoolType: SchoolType.MIDDLE },
  { value: 'third_middle', label: 'الصف الثالث متوسط', schoolType: SchoolType.MIDDLE },
  
  // إعدادي
  { value: 'fourth_science', label: 'الصف الرابع علمي', schoolType: SchoolType.HIGH },
  { value: 'fourth_literary', label: 'الصف الرابع أدبي', schoolType: SchoolType.HIGH },
  { value: 'fifth_science', label: 'الصف الخامس علمي', schoolType: SchoolType.HIGH },
  { value: 'fifth_literary', label: 'الصف الخامس أدبي', schoolType: SchoolType.HIGH },
  { value: 'sixth_science', label: 'الصف السادس علمي', schoolType: SchoolType.HIGH },
  { value: 'sixth_literary', label: 'الصف السادس أدبي', schoolType: SchoolType.HIGH },
];

export const getGradesForSchoolTypes = (schoolTypes: SchoolType[]): Grade[] => {
  return GRADES.filter(grade => 
    schoolTypes.some(type => grade.schoolType === type)
  );
};
