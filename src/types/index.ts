export type UserRole = 'ADMIN' | 'USER';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  fullName: string;
  position?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export type BankType = 'KTB' | 'BAAC' | 'GSB' | string;

export interface ChequeItem {
  id: string;
  description: string;
  amount: number;
}

export interface Cheque {
  id: string;
  chequeNumber?: string; // เลขที่เช็ค เช่น 1029384 (7-8 หลัก)
  stubDate: string; // YYYY-MM-DD (วันที่ต้นขั้ว)
  chequeDate?: string; // YYYY-MM-DD (วันที่บนหน้าเช็ค ถ้าไม่ระบุใช้วันที่ต้นขั้ว)
  stubPayeeName: string; // ชื่อผู้รับต้นขั้วเช็ค
  chequePayeeName: string; // ชื่อผู้รับเงิน (ตัวเช็ค)
  dikaNumber: string; // เลขที่ฎีกาคลังรับ (e.g. 123/69)
  bankAccountNo?: string; // เลขที่บัญชีธนาคารสั่งจ่าย
  items: ChequeItem[]; // รายการฎีกาและจำนวนเงิน
  totalAmount: number; // ยอดรวมก่อนหักภาษี
  totalAmountThaiText: string; // สองหมื่นห้าพันเจ็ดร้อยห้าสิบบาทถ้วน
  withholdingTaxPercent?: number; // % ภาษีหัก ณ ที่จ่าย เช่น 1, 0.75, 2, 3
  withholdingTaxAmount?: number; // จำนวนเงินภาษีหัก ณ ที่จ่าย
  netPaidAmount?: number; // ยอดสุทธิสั่งจ่ายหลังหักภาษี (ตัวเลขบนเช็ค)
  memo?: string; // บันทึกช่วยจำ / หมายเหตุ
  status?: 'PENDING' | 'ISSUED' | 'VOID'; // สถานะเช็ค
  voidReason?: string; // เหตุผลการยกเลิกเช็ค (ถ้า status === 'VOID')
  voidAt?: string;
  voidBy?: string;
  createdBy: string; // ชื่อ-สกุลผู้สร้าง
  createdByUsername: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  printCount: number; // 0 = ยังไม่ออก, 1, 2, ...
  lastPrintedAt?: string;
  lastPrintedBy?: string;
  lastBankType?: BankType;
}

export interface ChequePrintLog {
  id: string;
  chequeId: string;
  chequeNumber?: string; // เลขที่เช็คที่ใช้พิมพ์
  dikaNumber: string;
  chequePayeeName: string;
  totalAmount: number;
  bankType: BankType;
  printNo: number; // 1, 2, 3...
  printedBy: string; // ชื่อ-สกุล
  printedByUsername: string;
  printedAt: string; // ISO string
  reprintReason?: string; // เช็คพิมพ์ผิด, กระดาษติด, etc.
  reprintNote?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  username: string;
  userFullName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PRINT' | 'REPRINT' | 'LOGIN' | 'SETTING_UPDATE';
  target: string;
  details: string;
}

export interface FieldPosition {
  x: number; // mm from left edge
  y: number; // mm from top edge
  fontSizePt: number;
  prefix?: string;
  suffix?: string;
  letterSpacingMm?: number;
}

export type CrossingType = 'NONE' | 'AC_PAYEE' | 'AND_CO';

export interface BankTemplateConfig {
  bankType: BankType;
  bankNameThai: string;
  bankNameEng: string;
  bankColor: string;
  widthMm: number;
  heightMm: number;
  globalOffsetX: number; // mm
  globalOffsetY: number; // mm
  isCustom?: boolean;
  customBgImageUrl?: string; // Optional user-uploaded cheque background image
  strikeBearer?: {
    x: number;
    y: number;
    widthMm: number;
    enabledDefault?: boolean;
  };
  crossing?: {
    x: number;
    y: number;
    typeDefault?: CrossingType;
  };
  fields: {
    date: FieldPosition;
    payee: FieldPosition;
    amountText: FieldPosition;
    amountNumber: FieldPosition;
    stubDate?: FieldPosition;
    stubPayee?: FieldPosition;
    stubDika?: FieldPosition;
    stubAmount?: FieldPosition;
  };
}
