export interface School {
  id?: string;
  nameArabic: string;
  nameEnglish: string;
  types: SchoolType[];
  address: string;
  phone: string;
  principalName: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum SchoolType {
  ELEMENTARY = 'elementary',
  MIDDLE = 'middle',
  HIGH = 'high'
}

export interface Student {
  id?: string;
  fullName: string;
  schoolId: string;
  grade: string;
  classSection: string; // Add classSection property
  totalFee: number;
  startDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Installment {
  id?: string;
  installmentNumber: number; // رقم مميز بالتسلسل
  studentId: string;
  studentName: string;
  amount: number;
  createdAt: Date;
  notes?: string;
}

export enum AdditionalFeeType {
  REGISTRATION = 'registration',
  UNIFORM = 'uniform',
  BOOKS = 'books',
  CUSTOM = 'custom'
}

export interface AdditionalFee {
  id?: string;
  feeNumber: number; // رقم متسلسل فريد للرسم
  studentId: string;
  studentName: string;
  schoolId: string;
  type: AdditionalFeeType;
  customTypeName?: string; // للرسوم المخصصة
  amount: number;
  isPaid: boolean;
  paidDate?: Date;
  createdAt: Date;
  notes?: string;
}

export interface ExternalIncome {
  id?: string;
  source: string;
  amount: number;
  date: Date;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Grade {
  value: string;
  label: string;
  schoolType: SchoolType;
}
