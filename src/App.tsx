import React, { useState, useEffect } from 'react';
import { Cheque, User } from './types';
import { StorageService } from './utils/storage';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { ChequeManagement } from './components/ChequeManagement';
import { ChequeFormModal } from './components/ChequeFormModal';
import { ChequePrintModal } from './components/ChequePrintModal';
import { ChequeHistoryModal } from './components/ChequeHistoryModal';
import { PaymentVoucherModal } from './components/PaymentVoucherModal';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { PrintLogsView } from './components/PrintLogsView';
import { SettingsView } from './components/SettingsView';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageService.getCurrentUser());
  const [currentTab, setCurrentTab] = useState<'cheques' | 'dashboard' | 'logs' | 'settings'>('cheques');
  const [cheques, setCheques] = useState<Cheque[]>(() => StorageService.getCheques());

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCheque, setEditingCheque] = useState<Cheque | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printingCheque, setPrintingCheque] = useState<Cheque | null>(null);
  const [batchPrintingCheques, setBatchPrintingCheques] = useState<Cheque[] | undefined>(undefined);

  const [voucherCheques, setVoucherCheques] = useState<Cheque[] | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyCheque, setHistoryCheque] = useState<Cheque | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshData = () => {
    setCheques(StorageService.getCheques());
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    showToast(`ยินดีต้อนรับ ${user.fullName} เข้าสู่ระบบ`);
  };

  const handleLogout = () => {
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
    setCurrentTab('cheques');
  };

  // Cheque Handlers
  const handleOpenAddModal = () => {
    setEditingCheque(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (cheque: Cheque) => {
    setEditingCheque(cheque);
    setIsFormModalOpen(true);
  };

  const handleSaveCheque = (chequeToSave: Cheque) => {
    if (!currentUser) return;
    const saved = StorageService.saveCheque(chequeToSave, currentUser);
    refreshData();
    setIsFormModalOpen(false);
    setEditingCheque(null);
    showToast(`บันทึกรายการฎีกา ${saved.dikaNumber} เรียบร้อยแล้ว`);
  };

  const handleSaveAndPrintCheque = (chequeToSave: Cheque) => {
    if (!currentUser) return;
    const saved = StorageService.saveCheque(chequeToSave, currentUser);
    refreshData();
    setIsFormModalOpen(false);
    setEditingCheque(null);
    showToast(`บันทึกรายการฎีกา ${saved.dikaNumber} สำเร็จ เปิดหน้าต่างสั่งพิมพ์เช็คทันที`);
    handleOpenPrintModal(saved);
  };

  const handleOpenPrintModal = (cheque: Cheque, batch?: Cheque[]) => {
    setPrintingCheque(cheque);
    setBatchPrintingCheques(batch);
    setIsPrintModalOpen(true);
  };

  const handlePrintSuccess = (chequeId: string) => {
    refreshData();
    const updated = StorageService.getChequeById(chequeId);
    showToast(`บันทึกประวัติการออกเช็คฎีกา ${updated?.dikaNumber || ''} เรียบร้อยแล้ว`);
  };

  const handleOpenHistoryModal = (cheque: Cheque) => {
    setHistoryCheque(cheque);
    setIsHistoryModalOpen(true);
  };

  // Keyboard Shortcuts: F2 to create new cheque, Escape to close modals
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // F2 key to quickly add cheque
      if (e.key === 'F2') {
        e.preventDefault();
        setEditingCheque(null);
        setIsFormModalOpen(true);
        return;
      }

      // Escape to close active modal
      if (e.key === 'Escape') {
        if (isFormModalOpen) setIsFormModalOpen(false);
        if (isPrintModalOpen) setIsPrintModalOpen(false);
        if (isHistoryModalOpen) setIsHistoryModalOpen(false);
        if (voucherCheques) setVoucherCheques(null);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isFormModalOpen, isPrintModalOpen, isHistoryModalOpen, voucherCheques]);

  // If not logged in, show login page
  if (!currentUser) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 p-3.5 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl border border-slate-700 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab 1: Cheques Management (หน้าออกเช็ค) */}
        {currentTab === 'cheques' && (
          <ChequeManagement
            currentUser={currentUser}
            cheques={cheques}
            onOpenAddModal={handleOpenAddModal}
            onOpenEditModal={handleOpenEditModal}
            onOpenPrintModal={handleOpenPrintModal}
            onOpenHistoryModal={handleOpenHistoryModal}
            onRefreshData={refreshData}
          />
        )}

        {/* Tab 2: Executive Dashboard (สรุปเสนอผู้บริหาร) */}
        {currentTab === 'dashboard' && (
          <ExecutiveDashboard
            cheques={cheques}
            onOpenPrintModal={handleOpenPrintModal}
            onOpenHistoryModal={handleOpenHistoryModal}
          />
        )}

        {/* Tab 3: Print Logs (ประวัติการออกเช็คทั้งหมด) */}
        {currentTab === 'logs' && <PrintLogsView />}

        {/* Tab 4: Settings (ตั้งค่าระบบ) */}
        {currentTab === 'settings' && (
          <SettingsView
            currentUser={currentUser}
            onRefreshData={refreshData}
          />
        )}
      </main>

      {/* Cheque Form Modal (Add / Edit) */}
      <ChequeFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingCheque(null);
        }}
        onSave={handleSaveCheque}
        onSaveAndPrint={handleSaveAndPrintCheque}
        editingCheque={editingCheque}
        currentUser={currentUser}
      />

      {/* Cheque Print Modal (Select Bank, Preview, Calibrate, Print, Append-Only Log) */}
      {printingCheque && (
        <ChequePrintModal
          isOpen={isPrintModalOpen}
          onClose={() => {
            setIsPrintModalOpen(false);
            setPrintingCheque(null);
            setBatchPrintingCheques(undefined);
          }}
          cheque={printingCheque}
          batchCheques={batchPrintingCheques}
          currentUser={currentUser}
          onPrintSuccess={handlePrintSuccess}
          onOpenHistory={(c) => {
            setIsPrintModalOpen(false);
            setPrintingCheque(null);
            handleOpenHistoryModal(c);
          }}
          onOpenPaymentVoucher={(c) => {
            setIsPrintModalOpen(false);
            setPrintingCheque(null);
            setVoucherCheques([c]);
          }}
        />
      )}

      {/* Cheque History Modal (Append-Only Print Log & Audit Trail) */}
      <ChequeHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setHistoryCheque(null);
        }}
        cheque={historyCheque}
      />

      {/* Payment Voucher Modal (from Print Modal or Global) */}
      {voucherCheques && (
        <PaymentVoucherModal
          isOpen={Boolean(voucherCheques)}
          onClose={() => setVoucherCheques(null)}
          cheques={voucherCheques}
          currentUser={currentUser}
        />
      )}

      {/* Footer */}
      <footer className="no-print border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        ระบบจัดทำและพิมพ์เช็ค (Cheque Management System) · รองรับแม่แบบ KTB (241×90mm), BAAC (235×90mm), GSB (239×90mm)
      </footer>
    </div>
  );
}
