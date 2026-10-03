import React, { useState } from 'react';
import { BankTemplateConfig, BankType, User } from '../types';
import { StorageService, hashPassword } from '../utils/storage';
import { formatThaiDateTime } from '../utils/dateUtils';
import { ChequeBackground } from './ChequeBackground';
import { InteractiveChequeCanvas, EditableFieldKey } from './InteractiveChequeCanvas';
import { AddTemplateModal } from './AddTemplateModal';
import {
  Settings,
  Users,
  Sliders,
  Shield,
  Database,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  Building,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  Maximize2,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

interface SettingsViewProps {
  currentUser: User;
  onRefreshData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'TEMPLATES' | 'USERS' | 'AUDIT' | 'DATA'>('TEMPLATES');
  
  // Templates state
  const [templates, setTemplates] = useState<Record<BankType, BankTemplateConfig>>(StorageService.getTemplates());
  const [selectedBank, setSelectedBank] = useState<BankType>('KTB');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Interactive mouse drag and enlarged editor states
  const [selectedField, setSelectedField] = useState<EditableFieldKey | null>('payee');
  const [isEnlargedEditorOpen, setIsEnlargedEditorOpen] = useState(false);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [newTemplateData, setNewTemplateData] = useState({
    bankType: '',
    bankNameThai: '',
    bankNameEng: '',
    bankColor: '#0284c7',
    widthMm: 241,
    heightMm: 90,
    baseTemplate: 'KTB',
  });

  // Users state
  const [users, setUsers] = useState<User[]>(StorageService.getUsers());
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [userFormData, setUserFormData] = useState<{
    username: string;
    fullName: string;
    position: string;
    role: 'ADMIN' | 'USER';
    status: 'ACTIVE' | 'INACTIVE';
    password?: string;
  }>({
    username: '',
    fullName: '',
    position: '',
    role: 'USER',
    status: 'ACTIVE',
    password: '',
  });

  // Audit Logs
  const auditLogs = StorageService.getAuditLogs();

  const isAdmin = currentUser.role === 'ADMIN';

  // Bank template editing
  const currentBankConfig = templates[selectedBank] || Object.values(templates)[0];

  const handleUpdateTemplateField = (
    fieldName: 'date' | 'payee' | 'amountText' | 'amountNumber',
    prop: 'x' | 'y' | 'fontSizePt' | 'prefix' | 'suffix' | 'letterSpacingMm',
    value: any
  ) => {
    const updated = {
      ...currentBankConfig,
      fields: {
        ...currentBankConfig.fields,
        [fieldName]: {
          ...currentBankConfig.fields[fieldName],
          [prop]: value,
        }
      }
    };
    setTemplates({
      ...templates,
      [selectedBank]: updated,
    });
  };

  const handleUpdateGlobalOffset = (axis: 'globalOffsetX' | 'globalOffsetY', value: number) => {
    const updated = {
      ...currentBankConfig,
      [axis]: value,
    };
    setTemplates({
      ...templates,
      [selectedBank]: updated,
    });
  };

  const handleUpdateFieldPosition = (field: EditableFieldKey, x: number, y: number) => {
    const updated = {
      ...currentBankConfig,
      fields: {
        ...currentBankConfig.fields,
        [field]: {
          ...currentBankConfig.fields[field],
          x,
          y,
        }
      }
    };
    setTemplates({
      ...templates,
      [selectedBank]: updated,
    });
  };

  const handleUpdateFontSize = (field: EditableFieldKey, fontSize: number) => {
    const updated = {
      ...currentBankConfig,
      fields: {
        ...currentBankConfig.fields,
        [field]: {
          ...currentBankConfig.fields[field],
          fontSizePt: fontSize,
        }
      }
    };
    setTemplates({
      ...templates,
      [selectedBank]: updated,
    });
  };

  const handleSaveCurrentTemplate = () => {
    StorageService.saveTemplate(currentBankConfig, currentUser);
    setSaveSuccessMsg(`บันทึกพิกัดและขนาดของ ${currentBankConfig.bankNameThai} เรียบร้อยแล้ว`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
    onRefreshData();
  };

  const handleResetBankTemplate = () => {
    if (confirm(`คืนค่าพิกัดเริ่มต้นมาตรฐานของ ${currentBankConfig.bankNameThai}?`)) {
      const defaultTemplates = StorageService.getDefaultTemplates();
      const def = defaultTemplates[selectedBank];
      if (def) {
        StorageService.saveTemplate(def, currentUser);
        setTemplates({
          ...templates,
          [selectedBank]: def,
        });
        setSaveSuccessMsg(`คืนค่าพิกัดเริ่มต้นของ ${def.bankNameThai} เรียบร้อยแล้ว`);
        setTimeout(() => setSaveSuccessMsg(null), 3000);
        onRefreshData();
      }
    }
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newTemplateData.bankType.trim().toUpperCase();
    if (!code || !newTemplateData.bankNameThai.trim()) {
      alert('กรุณาระบุรหัสแม่แบบและชื่อธนาคาร');
      return;
    }
    if (templates[code]) {
      alert(`รหัสแม่แบบ "${code}" มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น`);
      return;
    }

    const baseConfig = templates[newTemplateData.baseTemplate] || currentBankConfig || Object.values(templates)[0];
    const newConfig: BankTemplateConfig = {
      bankType: code,
      bankNameThai: newTemplateData.bankNameThai.trim(),
      bankNameEng: newTemplateData.bankNameEng.trim() || code,
      bankColor: newTemplateData.bankColor || '#0284c7',
      widthMm: Number(newTemplateData.widthMm) || 241,
      heightMm: Number(newTemplateData.heightMm) || 90,
      globalOffsetX: 0,
      globalOffsetY: 0,
      isCustom: true,
      fields: JSON.parse(JSON.stringify(baseConfig.fields)),
    };

    StorageService.saveTemplate(newConfig, currentUser);
    const updated = StorageService.getTemplates();
    setTemplates(updated);
    setSelectedBank(code);
    setIsCreateTemplateOpen(false);
    setSaveSuccessMsg(`เพิ่มแม่แบบเช็ค "${newConfig.bankNameThai}" สำเร็จแล้ว สามารถลากปรับพิกัดต่อได้ทันที`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
    onRefreshData();
  };

  const handleDeleteTemplate = (code: string) => {
    const tpl = templates[code];
    if (!tpl) return;
    if (!confirm(`ยืนยันการลบแม่แบบเช็ค "${tpl.bankNameThai}" (${code})?`)) return;

    StorageService.deleteTemplate(code, currentUser);
    const updated = StorageService.getTemplates();
    setTemplates(updated);
    const remainingKeys = Object.keys(updated);
    if (selectedBank === code && remainingKeys.length > 0) {
      setSelectedBank(remainingKeys[0]);
    }
    setSaveSuccessMsg(`ลบแม่แบบเช็ค "${tpl.bankNameThai}" เรียบร้อยแล้ว`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
    onRefreshData();
  };

  const handleUploadCustomImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const updated = {
        ...currentBankConfig,
        customBgImageUrl: dataUrl,
      };
      StorageService.saveTemplate(updated, currentUser);
      setTemplates({
        ...templates,
        [selectedBank]: updated,
      });
      setSaveSuccessMsg(`อัปโหลดรูปภาพเช็คจริงสำหรับ ${currentBankConfig.bankNameThai} สำเร็จแล้ว`);
      setTimeout(() => setSaveSuccessMsg(null), 3500);
      onRefreshData();
    };
    reader.readAsDataURL(file);
  };

  const handleClearCustomImage = () => {
    const updated = {
      ...currentBankConfig,
      customBgImageUrl: undefined,
    };
    StorageService.saveTemplate(updated, currentUser);
    setTemplates({
      ...templates,
      [selectedBank]: updated,
    });
    setSaveSuccessMsg(`รีเซ็ตรูปภาพพื้นหลังกลับสู่แม่แบบมาตรฐานสำหรับ ${currentBankConfig.bankNameThai}`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
    onRefreshData();
  };

  // User Actions
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.username || !userFormData.fullName) return;

    let pHash = editingUser ? editingUser.passwordHash : '';
    if (userFormData.password && userFormData.password.trim()) {
      pHash = await hashPassword(userFormData.password);
    } else if (!editingUser) {
      pHash = await hashPassword('1234'); // Default password if new
    }

    const userToSave: User = {
      id: editingUser ? editingUser.id : 'user_' + Date.now(),
      username: userFormData.username.trim().toLowerCase(),
      fullName: userFormData.fullName.trim(),
      position: userFormData.position.trim(),
      role: userFormData.role,
      status: userFormData.status,
      passwordHash: pHash,
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString(),
    };

    StorageService.saveUser(userToSave, currentUser);
    setUsers(StorageService.getUsers());
    setIsAddUserOpen(false);
    setEditingUser(null);
    onRefreshData();
  };

  const handleToggleUserStatus = (u: User) => {
    if (u.id === currentUser.id) {
      alert('ไม่สามารถระงับการใช้งานบัญชีของตนเองได้');
      return;
    }
    const updated: User = {
      ...u,
      status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
    };
    StorageService.saveUser(updated, currentUser);
    setUsers(StorageService.getUsers());
    onRefreshData();
  };

  const handleDeleteUser = (u: User) => {
    if (u.id === currentUser.id) {
      alert('ไม่สามารถลบบัญชีของตนเองได้');
      return;
    }
    if (confirm(`ยืนยันการลบผู้ใช้งาน ${u.fullName} (${u.username})?`)) {
      StorageService.deleteUser(u.id, currentUser);
      setUsers(StorageService.getUsers());
      onRefreshData();
    }
  };

  const handleResetToDemo = () => {
    if (confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับสู่ค่าเริ่มต้นสำหรับการสาธิตหรือไม่? (ข้อมูลที่สร้างใหม่จะถูกล้าง)')) {
      StorageService.resetToDefault();
      setTemplates(StorageService.getTemplates());
      setUsers(StorageService.getUsers());
      onRefreshData();
      alert('รีเซ็ตข้อมูลระบบกลับสู่ค่าเริ่มต้นเรียบร้อยแล้ว');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-600" />
          <span>ตั้งค่าระบบ (System Configuration)</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          จัดการแม่แบบตำแหน่งพิมพ์เช็ค, ผู้ใช้งานระบบ, บันทึกการปฏิบัติงาน (Audit Log) และการสำรองข้อมูล
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('TEMPLATES')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 -mb-px ${
            activeTab === 'TEMPLATES'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>ตั้งค่าตำแหน่งพิมพ์เช็ค (Templates)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('USERS')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 -mb-px ${
            activeTab === 'USERS'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>จัดการผู้ใช้งาน ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('AUDIT')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 -mb-px ${
            activeTab === 'AUDIT'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>ประวัติกิจกรรมระบบ (Audit Log)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DATA')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 -mb-px ${
            activeTab === 'DATA'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>การจัดการข้อมูลและรีเซ็ต</span>
        </button>
      </div>

      {/* TAB 1: TEMPLATE CALIBRATION */}
      {activeTab === 'TEMPLATES' && (
        <div className="space-y-6">
          
          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Bank selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">เลือกแม่แบบเช็คธนาคาร:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {Object.values(templates).map((tpl) => {
                  const isSel = selectedBank === tpl.bankType;
                  return (
                    <div key={tpl.bankType} className="inline-flex items-center group">
                      <button
                        type="button"
                        onClick={() => setSelectedBank(tpl.bankType)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSel
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: tpl.bankColor || '#0ea5e9' }}
                        />
                        <span>{tpl.bankType} — {tpl.bankNameThai} ({tpl.widthMm} × {tpl.heightMm} มม.)</span>
                        {tpl.isCustom && (
                          <span className={`text-[9px] px-1 py-0.2 rounded font-medium ${
                            isSel ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-800'
                          }`}>
                            กำหนดเอง
                          </span>
                        )}
                      </button>

                      {tpl.isCustom && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(tpl.bankType);
                          }}
                          className="ml-0.5 p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer transition-colors"
                          title={`ลบแม่แบบ ${tpl.bankNameThai}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Add new template button */}
                <button
                  type="button"
                  onClick={() => {
                    setNewTemplateData({
                      bankType: '',
                      bankNameThai: '',
                      bankNameEng: '',
                      bankColor: '#0284c7',
                      widthMm: 241,
                      heightMm: 90,
                      baseTemplate: selectedBank,
                    });
                    setIsCreateTemplateOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="สร้างแม่แบบเช็คธนาคารใหม่ด้วยตนเอง"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ เพิ่มแม่แบบเช็คใหม่</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetBankTemplate}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                title="คืนค่าพิกัดเริ่มต้นมาตรฐานของธนาคารนี้"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>คืนค่าเริ่มต้น</span>
              </button>

              <button
                type="button"
                onClick={handleSaveCurrentTemplate}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>บันทึกการตั้งค่าพิกัด {selectedBank}</span>
              </button>
            </div>
          </div>

          {/* 1. Large Live Cheque Canvas Workbench (Adjustable directly with mouse like popup) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>จำลองตำแหน่งตัวอย่างแบบเรียลไทม์ ({currentBankConfig.widthMm} × {currentBankConfig.heightMm} มม.):</span>
                  <span className="text-xs px-2.5 py-0.5 font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-md">
                    {currentBankConfig.bankNameThai}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  🖱️ สามารถใช้เมาส์คลิกค้างที่ตัวหนังสือบนเช็คเพื่อลากปรับตำแหน่งได้โดยตรง หรือกดปุ่มลูกศรเพื่อปรับละเอียดทีละ 0.5 มม.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Upload Cheque Image Controls */}
                {currentBankConfig.customBgImageUrl ? (
                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-xs">
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>มีรูปเช็คจริงแล้ว</span>
                    </span>
                    <label
                      className="px-2 py-0.5 bg-white hover:bg-slate-50 border border-slate-300 rounded text-[11px] font-semibold text-slate-700 cursor-pointer transition-colors"
                      title="อัปโหลดรูปภาพใหม่แทนที่รูปเดิม"
                    >
                      <span>เปลี่ยนรูป</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleUploadCustomImage}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleClearCustomImage}
                      className="p-1 text-red-600 hover:text-red-700 hover:bg-red-100/60 rounded cursor-pointer transition-colors"
                      title="ลบรูปภาพเช็คและกลับไปใช้เส้นโครงร่างมาตรฐาน"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label
                    className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    title="อัปโหลดรูปภาพสแกนเช็คจริง (PNG, JPG) เพื่อใช้เป็นพื้นหลังอ้างอิงตอนลากปรับพิกัด"
                  >
                    <Upload className="w-3.5 h-3.5 text-sky-600" />
                    <span>อัปโหลดรูปภาพเช็คจริง</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleUploadCustomImage}
                      className="hidden"
                    />
                  </label>
                )}

                <button
                  type="button"
                  onClick={handleSaveCurrentTemplate}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>บันทึกพิกัด {selectedBank}</span>
                </button>
              </div>
            </div>

            {/* Large Interactive Canvas */}
            <InteractiveChequeCanvas
              config={currentBankConfig}
              selectedField={selectedField}
              onSelectField={setSelectedField}
              onUpdateFieldPosition={handleUpdateFieldPosition}
              onUpdateFontSize={handleUpdateFontSize}
              onUploadImage={handleUploadCustomImage}
              onClearImage={handleClearCustomImage}
              isEnlarged={true}
              showCrosshairsDefault={true}
            />
          </div>

          {/* 2. Coordinate & Font Size Cards (Exact layout from user screenshot) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
              พิกัดและขนาดตัวอักษร: {currentBankConfig.bankNameThai}
            </h2>

            {/* Global Offset */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="block text-xs font-semibold text-slate-700 mb-2">
                Global Offset (เลื่อนข้อความทั้งหมดบนเช็คพร้อมกัน เพื่อแก้เครื่องพิมพ์ป้อนกระดาษเยื้อง):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-600 block mb-1">แนวนอน (X Offset mm):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={currentBankConfig.globalOffsetX || 0}
                    onChange={(e) => handleUpdateGlobalOffset('globalOffsetX', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-xs tabular-nums text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">แนวตั้ง (Y Offset mm):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={currentBankConfig.globalOffsetY || 0}
                    onChange={(e) => handleUpdateGlobalOffset('globalOffsetY', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-xs tabular-nums text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Field 1: วันที่ (Date) */}
            <div
              onClick={() => setSelectedField('date')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedField === 'date'
                  ? 'border-emerald-500 bg-white ring-1 ring-emerald-500 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-xs">
                  1. วันที่ (Date)
                </span>
                {selectedField === 'date' ? (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    กำลังเลือกปรับ (Active)
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">ลากบนเช็คได้</span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-slate-500 block mb-1">X (มม.):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={currentBankConfig.fields.date.x}
                    onFocus={() => setSelectedField('date')}
                    onChange={(e) => handleUpdateTemplateField('date', 'x', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">Y (มม.):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={currentBankConfig.fields.date.y}
                    onFocus={() => setSelectedField('date')}
                    onChange={(e) => handleUpdateTemplateField('date', 'y', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">ขนาด Font (pt):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={currentBankConfig.fields.date.fontSizePt}
                    onFocus={() => setSelectedField('date')}
                    onChange={(e) => handleUpdateTemplateField('date', 'fontSizePt', parseFloat(e.target.value) || 12)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 tabular-nums"
                  />
                </div>
              </div>
            </div>

            {/* Field 2: ชื่อผู้รับเงิน (Payee) */}
            <div
              onClick={() => setSelectedField('payee')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedField === 'payee'
                  ? 'border-emerald-500 bg-white ring-1 ring-emerald-500 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-xs">
                  2. ชื่อผู้รับเงิน (Payee)
                </span>
                {selectedField === 'payee' ? (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    กำลังเลือกปรับ (Active)
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">ลากบนเช็คได้</span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-slate-500 block mb-1">X (มม.):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={currentBankConfig.fields.payee.x}
                    onFocus={() => setSelectedField('payee')}
                    onChange={(e) => handleUpdateTemplateField('payee', 'x', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">Y (มม.):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={currentBankConfig.fields.payee.y}
                    onFocus={() => setSelectedField('payee')}
                    onChange={(e) => handleUpdateTemplateField('payee', 'y', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">ขนาด Font (pt):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={currentBankConfig.fields.payee.fontSizePt}
                    onFocus={() => setSelectedField('payee')}
                    onChange={(e) => handleUpdateTemplateField('payee', 'fontSizePt', parseFloat(e.target.value) || 12)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 tabular-nums"
                  />
                </div>
              </div>
            </div>

            {/* Field 3: จำนวนเงินตัวอักษร (Thai Baht Text) */}
            <div
              onClick={() => setSelectedField('amountText')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedField === 'amountText'
                  ? 'border-emerald-500 bg-white ring-1 ring-emerald-500 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-xs">
                  3. จำนวนเงินตัวอักษร (Thai Baht Text)
                </span>
                {selectedField === 'amountText' ? (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    กำลังเลือกปรับ (Active)
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">ลากบนเช็คได้</span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-slate-500 block mb-1">X (มม.):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={currentBankConfig.fields.amountText.x}
                    onFocus={() => setSelectedField('amountText')}
                    onChange={(e) => handleUpdateTemplateField('amountText', 'x', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">Y (มม.):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={currentBankConfig.fields.amountText.y}
                    onFocus={() => setSelectedField('amountText')}
                    onChange={(e) => handleUpdateTemplateField('amountText', 'y', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">ขนาด Font (pt):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={currentBankConfig.fields.amountText.fontSizePt}
                    onFocus={() => setSelectedField('amountText')}
                    onChange={(e) => handleUpdateTemplateField('amountText', 'fontSizePt', parseFloat(e.target.value) || 12)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 tabular-nums"
                  />
                </div>
              </div>
            </div>

            {/* Field 4: จำนวนเงินตัวเลข (Numeric Amount) */}
            <div
              onClick={() => setSelectedField('amountNumber')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedField === 'amountNumber'
                  ? 'border-emerald-500 bg-white ring-1 ring-emerald-500 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-xs">
                  4. จำนวนเงินตัวเลข (Numeric Amount)
                </span>
                {selectedField === 'amountNumber' ? (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    กำลังเลือกปรับ (Active)
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">ลากบนเช็คได้</span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-slate-500 block mb-1">X (มม.):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={currentBankConfig.fields.amountNumber.x}
                    onFocus={() => setSelectedField('amountNumber')}
                    onChange={(e) => handleUpdateTemplateField('amountNumber', 'x', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">Y (มม.):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={currentBankConfig.fields.amountNumber.y}
                    onFocus={() => setSelectedField('amountNumber')}
                    onChange={(e) => handleUpdateTemplateField('amountNumber', 'y', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">ขนาด Font (pt):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={currentBankConfig.fields.amountNumber.fontSizePt}
                    onFocus={() => setSelectedField('amountNumber')}
                    onChange={(e) => handleUpdateTemplateField('amountNumber', 'fontSizePt', parseFloat(e.target.value) || 12)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 tabular-nums"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveCurrentTemplate}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>บันทึกการตั้งค่าพิกัด {selectedBank}</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                รายชื่อผู้ใช้งานระบบ (User Accounts)
              </h2>
              <p className="text-xs text-slate-500">
                ผู้ใช้งานแต่ละคนต้องมีบัญชีของตนเองเพื่อระบุตัวตนในการสร้าง แก้ไข และออกเช็คย้อนหลัง
              </p>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setUserFormData({
                    username: '',
                    fullName: '',
                    position: '',
                    role: 'USER',
                    status: 'ACTIVE',
                    password: '',
                  });
                  setIsAddUserOpen(true);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ เพิ่มผู้ใช้งานใหม่</span>
              </button>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">ชื่อ-นามสกุล</th>
                  <th className="py-2.5 px-3">Username</th>
                  <th className="py-2.5 px-3">ตำแหน่ง</th>
                  <th className="py-2.5 px-3 text-center">สิทธิ์ (Role)</th>
                  <th className="py-2.5 px-3 text-center">สถานะ</th>
                  <th className="py-2.5 px-3 text-center w-28">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {u.fullName} {u.id === currentUser.id && <span className="text-[10px] text-emerald-600 font-normal">(คุณ)</span>}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{u.username}</td>
                    <td className="py-2.5 px-3 text-slate-600">{u.position || '-'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {u.status === 'ACTIVE' ? 'เปิดใช้งาน' : 'ระงับการใช้งาน'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {isAdmin ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(u);
                              setUserFormData({
                                username: u.username,
                                fullName: u.fullName,
                                position: u.position || '',
                                role: u.role,
                                status: u.status,
                                password: '',
                              });
                              setIsAddUserOpen(true);
                            }}
                            className="p-1 text-slate-600 hover:text-blue-700 rounded hover:bg-slate-100 cursor-pointer"
                            title="แก้ไขข้อมูลผู้ใช้"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={u.id === currentUser.id}
                            onClick={() => handleToggleUserStatus(u)}
                            className="p-1 text-slate-600 hover:text-amber-700 rounded hover:bg-slate-100 cursor-pointer disabled:opacity-30"
                            title={u.status === 'ACTIVE' ? 'ระงับการใช้งาน' : 'เปิดใช้งาน'}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={u.id === currentUser.id}
                            onClick={() => handleDeleteUser(u)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer disabled:opacity-30"
                            title="ลบผู้ใช้งาน"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add / Edit User Modal */}
          {isAddUserOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  {editingUser ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}
                </h3>

                <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Username <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      disabled={!!editingUser}
                      value={userFormData.username}
                      onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                      placeholder="เช่น somchai"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={userFormData.fullName}
                      onChange={(e) => setUserFormData({ ...userFormData, fullName: e.target.value })}
                      placeholder="เช่น นายสมชาย ใจดี"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">ตำแหน่งงาน</label>
                    <input
                      type="text"
                      value={userFormData.position}
                      onChange={(e) => setUserFormData({ ...userFormData, position: e.target.value })}
                      placeholder="เช่น เจ้าหน้าที่การเงินและบัญชี"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      {editingUser ? 'เปลี่ยนรหัสผ่านใหม่ (ปล่อยว่างหากไม่เปลี่ยน)' : 'รหัสผ่าน (Password)'}
                    </label>
                    <input
                      type="password"
                      value={userFormData.password}
                      onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                      placeholder={editingUser ? '••••••••' : 'ค่าเริ่มต้น 1234'}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">ระดับสิทธิ์ (Role)</label>
                      <select
                        value={userFormData.role}
                        onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as 'ADMIN' | 'USER' })}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="USER">USER (เจ้าหน้าที่)</option>
                        <option value="ADMIN">ADMIN (ผู้ดูแลระบบ)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">สถานะ (Status)</label>
                      <select
                        value={userFormData.status}
                        onChange={(e) => setUserFormData({ ...userFormData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="ACTIVE">เปิดใช้งาน (Active)</option>
                        <option value="INACTIVE">ระงับการใช้งาน (Inactive)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsAddUserOpen(false)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold cursor-pointer"
                    >
                      บันทึกผู้ใช้งาน
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SYSTEM AUDIT LOG */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                บันทึกประวัติการทำรายการสำคัญ (System Audit Log)
              </h2>
              <p className="text-xs text-slate-500">
                ประวัติกิจกรรมการสร้าง แก้ไข ลบ พิมพ์ และพิมพ์ซ้ำในระบบ (Append-Only)
              </p>
            </div>
            <span className="text-xs text-slate-500">
              รวม {auditLogs.length} กิจกรรม
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">วันเวลา</th>
                    <th className="py-2.5 px-3">ผู้ดำเนินการ</th>
                    <th className="py-2.5 px-3 text-center">ประเภทเหตุการณ์</th>
                    <th className="py-2.5 px-3">เป้าหมาย</th>
                    <th className="py-2.5 px-3">รายละเอียด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                        {formatThaiDateTime(log.timestamp)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        {log.userFullName} <span className="text-slate-400 font-normal">({log.username})</span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          log.action === 'UPDATE' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          log.action === 'DELETE' ? 'bg-red-50 text-red-700 border border-red-200' :
                          log.action === 'PRINT' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                          log.action === 'REPRINT' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {log.target}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DATA MANAGEMENT & RESET */}
      {activeTab === 'DATA' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900">
              การสำรองและจัดการข้อมูลระบบ
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              ระบบจัดเก็บข้อมูลแบบถาวรบน Local Database ของเบราว์เซอร์ พร้อมประวัติการออกเช็คแบบ Append-Only คุณสามารถส่งออกข้อมูลเป็นไฟล์ JSON หรือรีเซ็ตกลับสู่ชุดข้อมูลสาธิตตัวอย่างเพื่อการนำเสนอได้
            </p>

            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const backup = {
                    users: StorageService.getUsers(),
                    cheques: StorageService.getCheques(),
                    printLogs: StorageService.getPrintLogs(),
                    auditLogs: StorageService.getAuditLogs(),
                    templates: StorageService.getTemplates(),
                    exportDate: new Date().toISOString(),
                  };
                  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `cheque_system_backup_${new Date().toISOString().substring(0, 10)}.json`;
                  a.click();
                  setSaveSuccessMsg('ดาวน์โหลดไฟล์สำรองข้อมูล (Backup JSON) สำเร็จแล้ว');
                  setTimeout(() => setSaveSuccessMsg(null), 3500);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>📦 สำรองข้อมูลทั้งหมด (Backup JSON)</span>
              </button>

              <label className="px-4 py-2 bg-sky-700 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5">
                <span>📥 กู้คืนข้อมูลจากไฟล์ (Restore JSON)</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const parsed = JSON.parse(event.target?.result as string);
                        const res = StorageService.restoreBackup(parsed, currentUser);
                        if (res.success) {
                          setSaveSuccessMsg(res.message);
                          onRefreshData();
                        } else {
                          alert(res.message);
                        }
                      } catch (err) {
                        alert('ไม่สามารถอ่านไฟล์ JSON ได้ หรือไฟล์เสียหาย');
                      }
                    };
                    reader.readAsText(file);
                    e.target.value = '';
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  const templateCsv = StorageService.generateCsvTemplate();
                  const blob = new Blob([templateCsv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'cheque_import_template.csv';
                  a.click();
                  setSaveSuccessMsg('ดาวน์โหลดตัวอย่างไฟล์ CSV สำหรับนำเข้าเช็คสำเร็จ');
                  setTimeout(() => setSaveSuccessMsg(null), 3500);
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>📄 ดาวน์โหลดแม่แบบ CSV นำเข้าเช็ค</span>
              </button>

              <button
                type="button"
                onClick={handleResetToDemo}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                รีเซ็ตข้อมูลกลับสู่ชุดสาธิตเริ่มต้น (Reset to Demo)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / CREATE CUSTOM CHEQUE TEMPLATE MODAL */}
      {isCreateTemplateOpen && (
        <AddTemplateModal
          isOpen={isCreateTemplateOpen}
          onClose={() => setIsCreateTemplateOpen(false)}
          currentUser={currentUser}
          onSuccess={(newCode) => {
            const updated = StorageService.getTemplates();
            setTemplates(updated);
            setSelectedBank(newCode);
            setSaveSuccessMsg(`สร้างแม่แบบเช็ค "${newCode}" สำเร็จแล้ว สามารถปรับพิกัดต่อได้ทันที`);
            setTimeout(() => setSaveSuccessMsg(null), 3500);
            onRefreshData();
          }}
        />
      )}

      {/* ENLARGED FULLSCREEN / POPUP MODAL FOR DRAG & DROP ADJUSTMENT */}
      {isEnlargedEditorOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/85 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-emerald-600 rounded-lg text-white shadow-xs">
                <Move className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">
                    ปรับตำแหน่งพิกัดและขนาดตัวอักษรด้วยเมาส์ (Drag & Drop Cheque Editor)
                  </h2>
                  <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">
                    {currentBankConfig.bankNameThai} ({currentBankConfig.widthMm} × {currentBankConfig.heightMm} มม.)
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  🖱️ ใช้เมาส์คลิกที่ตัวหนังสือบนเช็คเพื่อลากปรับตำแหน่ง หรือกดปุ่มลูกศรเพื่อปรับละเอียดทีละ 0.5 มม.
                </p>
              </div>
            </div>

            {/* Bank Switch Tabs in Popup */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 p-1 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setSelectedBank('KTB')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  selectedBank === 'KTB'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                1. ธ.กรุงไทย (รูปที่ 4)
              </button>
              <button
                type="button"
                onClick={() => setSelectedBank('BAAC')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  selectedBank === 'BAAC'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                2. ธ.ก.ส. (รูปที่ 3)
              </button>
              <button
                type="button"
                onClick={() => setSelectedBank('GSB')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  selectedBank === 'GSB'
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                3. ธ.ออมสิน (รูปที่ 2)
              </button>
            </div>

            {/* Actions: Reset, Save, Close */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetBankTemplate}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                title="คืนค่าพิกัดเริ่มต้นของธนาคารนี้"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>คืนค่าเริ่มต้น</span>
              </button>

              <button
                type="button"
                onClick={handleSaveCurrentTemplate}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Check className="w-4 h-4" />
                <span>บันทึกพิกัด {selectedBank}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEnlargedEditorOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
                title="ปิดหน้าต่างขยาย"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Field Selection Bar */}
          <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400 font-medium">เลือกฟิลด์ที่ต้องการจัด:</span>
              {(['date', 'payee', 'amountText', 'amountNumber'] as EditableFieldKey[]).map((fieldKey) => {
                const cfg = currentBankConfig.fields[fieldKey];
                const labels: Record<EditableFieldKey, string> = {
                  date: '1. วันที่ (Date)',
                  payee: '2. ชื่อผู้รับเงิน (Payee)',
                  amountText: '3. จำนวนเงินตัวอักษร',
                  amountNumber: '4. จำนวนเงินตัวเลข',
                };
                const isSel = selectedField === fieldKey;
                return (
                  <button
                    key={fieldKey}
                    type="button"
                    onClick={() => setSelectedField(fieldKey)}
                    className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSel
                        ? 'bg-emerald-600 text-white shadow-xs font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                    }`}
                  >
                    <span>{labels[fieldKey]}</span>
                    <span className="text-[10px] font-mono opacity-80">
                      ({cfg?.x}, {cfg?.y})
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4">
              {saveSuccessMsg && (
                <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1 bg-emerald-950/60 border border-emerald-600/40 px-2.5 py-0.5 rounded">
                  <Check className="w-3.5 h-3.5" />
                  {saveSuccessMsg}
                </span>
              )}
            </div>
          </div>

          {/* Scrollable Center Canvas Area */}
          <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center bg-slate-950/70">
            <InteractiveChequeCanvas
              config={currentBankConfig}
              selectedField={selectedField}
              onSelectField={setSelectedField}
              onUpdateFieldPosition={handleUpdateFieldPosition}
              onUpdateFontSize={handleUpdateFontSize}
              onUploadImage={handleUploadCustomImage}
              onClearImage={handleClearCustomImage}
              isEnlarged={true}
              showCrosshairsDefault={true}
            />
          </div>

          {/* Footer info bar */}
          <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 text-slate-400 text-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-4">
              <span>💡 <strong>คำแนะนำ:</strong> คลิกค้างที่กล่องข้อความบนเช็คแล้วลากไปยังตำแหน่งที่ต้องการ หรือใช้ปุ่มลูกศรเพื่อปรับทีละ 0.5 มม.</span>
              <span>· กด Shift ขณะลากหรือกดปุ่มลูกศรเพื่อปรับละเอียดระดับ 0.1 มม.</span>
            </div>
            <button
              type="button"
              onClick={() => setIsEnlargedEditorOpen(false)}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-xs cursor-pointer transition-colors"
            >
              เสร็จสิ้นการปรับ / ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
