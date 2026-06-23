import React, { useState, useEffect } from 'react';
import { Product, UserProfile } from '../types';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  DollarSign, 
  CreditCard, 
  ArrowRight, 
  Sparkles, 
  CheckCircle, 
  TrendingUp, 
  User, 
  MapPin, 
  RotateCcw, 
  Receipt, 
  Maximize2, 
  Minimize2, 
  ShoppingCart,
  Percent,
  Coins,
  Store,
  Clock,
  ChevronRight,
  RefreshCw,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface POSModuleProps {
  products: Product[];
  profile: UserProfile;
}

interface CartItem {
  product: Product;
  quantity: number;
  customNotes?: string;
}

interface Transaction {
  id: string;
  ticketNumber: string;
  timestamp: string;
  items: {
    name: string;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'Efectivo' | 'Tarjeta' | 'Transferencia';
  customerName: string;
  cashReceived?: number;
  changeGiven?: number;
  notes?: string;
  branch: string;
}

export default function POSModule({ products, profile }: POSModuleProps) {
  // Only display active products in POS
  const activeProducts = products.filter(p => p.isActive);

  // States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('Cliente General');
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [cashReceived, setCashReceived] = useState<string>('');
  const [transactionNotes, setTransactionNotes] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Simulated sales history for active auditing
  const [salesHistory, setSalesHistory] = useState<Transaction[]>([
    {
      id: 'tx-1001',
      ticketNumber: 'TKT-2026-00045',
      timestamp: new Date(Date.now() - 3600000 * 2).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('es-MX'),
      items: [
        { name: 'PAQUETE CAMPEÓN', price: 450, quantity: 1 },
        { name: 'PAQUETE AFICIONADO', price: 350, quantity: 1 }
      ],
      subtotal: 800,
      discount: 0,
      total: 800,
      paymentMethod: 'Efectivo',
      customerName: 'Manuel López',
      cashReceived: 1000,
      changeGiven: 200,
      branch: profile.branch || 'Sucursal Vialidad Guadalupe',
      notes: 'Sin picante para niños.'
    },
    {
      id: 'tx-1002',
      ticketNumber: 'TKT-2026-00046',
      timestamp: new Date(Date.now() - 3600000).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('es-MX'),
      items: [
        { name: 'PAQUETE REPECHAJE', price: 350, quantity: 2 }
      ],
      subtotal: 700,
      discount: 35, // 5% descto
      total: 665,
      paymentMethod: 'Tarjeta',
      customerName: 'Valeria S.',
      branch: profile.branch || 'Sucursal Vialidad Guadalupe'
    }
  ]);

  // Current completed ticket to view/print
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'danger' } | null>(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Play browser synthesizer sound for a nice vintage cash register effect!
  const playCashSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Chime note 1
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gain1.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.3);

      // Chime note 2 (slightly delayed)
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1320, audioCtx.currentTime); // E6
        gain2.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.4);
      }, 80);
    } catch (e) {
      console.warn('Audio Context is not allowed or supported by this browser', e);
    }
  };

  const showToast = (message: string, type: 'success' | 'info' | 'danger' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Image mapper for gorgeous aesthetic visuals
  const getProductImage = (name: string): string => {
    const n = name.toUpperCase();
    if (n.includes('AFICIONADO')) {
      return 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=600&q=80';
    } else if (n.includes('CAMPEÓN') || n.includes('CAMPEON')) {
      return 'https://images.unsplash.com/photo-1568144665113-d02bc36b2892?auto=format&fit=crop&w=600&q=80';
    } else if (n.includes('REPECHAJE')) {
      return 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=600&q=80';
    } else if (n.includes('FANÁTICO') || n.includes('FANATICO')) {
      return 'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?auto=format&fit=crop&w=600&q=80';
    }
    // Appetizing general Mexican street food fallback
    return 'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=600&q=80';
  };

  // Add Item to cart
  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1, customNotes: '' }]);
    }
    showToast(`¡"${product.name}" agregado a la orden!`, 'success');
  };

  // Decrease or remove item from cart
  const updateQuantity = (productId: string, delta: number) => {
    const updated = cart.map(item => {
      if (item.product.id === productId) {
        const nextQty = item.quantity + delta;
        return nextQty > 0 ? { ...item, quantity: nextQty } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[];

    setCart(updated);
  };

  // Remove completely
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
    showToast('Producto retirado de la orden.', 'info');
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const total = subtotal - discountAmount;

  // Change calculator
  const changeValue = cashReceived && parseFloat(cashReceived) >= total
    ? (parseFloat(cashReceived) - total).toFixed(2)
    : '0.00';

  // Perform Sale Submission
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('No puedes procesar una orden sin productos en el carrito.', 'danger');
      return;
    }

    const numericalCash = parseFloat(cashReceived);
    if (paymentMethod === 'Efectivo' && (isNaN(numericalCash) || numericalCash < total)) {
      showToast('Por favor introduce un importe de efectivo válido e igual o mayor al total de la venta.', 'danger');
      return;
    }

    // Generate unique ticket number
    const uniqueNum = 'TKT-' + new Date().getFullYear() + '-' + String(Math.floor(10000 + Math.random() * 90000));
    const timestampStr = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('es-MX');

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      ticketNumber: uniqueNum,
      timestamp: timestampStr,
      items: cart.map(item => ({
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      })),
      subtotal,
      discount: discountAmount,
      total,
      paymentMethod,
      customerName: customerName.trim() || 'Cliente General',
      cashReceived: paymentMethod === 'Efectivo' ? numericalCash : undefined,
      changeGiven: paymentMethod === 'Efectivo' ? parseFloat(changeValue) : undefined,
      notes: transactionNotes.trim() ? transactionNotes.trim() : undefined,
      branch: profile.branch || 'Sucursal Vialidad Guadalupe'
    };

    setSalesHistory([newTx, ...salesHistory]);
    setCompletedTransaction(newTx);
    playCashSound();
    
    // Clear cart and customer states
    setCart([]);
    setCustomerName('Cliente General');
    setCashReceived('');
    setTransactionNotes('');
    setDiscountPercent(0);
    setMobileCartOpen(false);

    showToast('¡Venta realizada con éxito! Generando ticket.', 'success');
  };

  // Direct Browser Printer Trigger
  const handlePrintTicket = () => {
    window.print();
  };

  // Filter products by search bar input
  const filteredProducts = activeProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.items.some(it => it.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderCheckoutForm = (isMobile: boolean = false) => {
    return (
      <form onSubmit={handleCheckoutSubmit} className="space-y-4">
        {/* Operator/Cashier line */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 border-b border-gray-100 pb-2">
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" /> Cajero: <strong>{profile.name}</strong>
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> <strong>{profile.branch?.replace('Sucursal ', '') || 'Zacatecas'}</strong>
          </span>
        </div>

        {/* Selected Items in Cart */}
        <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 pr-1">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <Coins className="w-10 h-10 mx-auto text-gray-200 animate-bounce" />
              <p className="text-xs font-semibold">El carrito está vacío</p>
              <p className="text-[10px] text-gray-400 px-4">Haz clic en los productos para iniciar la venta.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="py-3 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-[#064E3B] block uppercase tracking-wide truncate max-w-[160px]">
                    {item.product.name}
                  </span>
                  <span className="text-[10px] text-amber-600 font-mono font-bold block">
                    ${item.product.price} MXN c/u
                  </span>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-black text-gray-800 font-mono w-5 text-center">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 transition ml-2"
                    title="Eliminar de comanda"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Client Info & Discount block */}
        <div className="space-y-3 bg-gray-50 p-3 rounded-2xl border border-gray-100 text-xs">
          
          {/* Customer Name */}
          <div className="space-y-1">
            <label className="block font-bold text-gray-500 uppercase tracking-wider text-[10px]">Cliente del Servicio</label>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Cliente General"
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-xl bg-white text-gray-800 font-semibold focus:outline-none focus:border-[#064E3B]"
              />
            </div>
          </div>

          {/* Discount selection */}
          <div className="space-y-1">
            <label className="block font-bold text-gray-500 uppercase tracking-wider text-[10px]">Aplicar Descuento Especial</label>
            <div className="grid grid-cols-4 gap-1">
              {[0, 5, 10, 15].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setDiscountPercent(pct)}
                  className={`py-1 text-[10px] font-bold rounded-lg border uppercase tracking-wider transition ${
                    discountPercent === pct
                      ? 'bg-amber-500 text-white border-transparent shadow-xs'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {pct === 0 ? 'Sin dsc' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Payment selection */}
          <div className="space-y-1">
            <label className="block font-bold text-gray-500 uppercase tracking-wider text-[10px]">Método de Pago</label>
            <div className="grid grid-cols-3 gap-1">
              {(['Efectivo', 'Tarjeta', 'Transferencia'] as const).map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(method);
                    if (method !== 'Efectivo') setCashReceived('');
                  }}
                  className={`py-1.5 text-[9px] font-black rounded-lg border uppercase tracking-wider transition ${
                    paymentMethod === method
                      ? 'bg-[#064E3B] text-white border-transparent'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Cash change helper if Efectivo */}
          {paymentMethod === 'Efectivo' && (
            <div className="space-y-2 pt-1 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="block font-bold text-gray-500 uppercase tracking-wider text-[9px]">Efectivo Recibido</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="w-full pl-5 pr-2 py-1.5 border border-gray-300 rounded-xl bg-white text-gray-800 font-black focus:outline-none focus:border-[#064E3B]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <label className="block font-bold text-gray-500 uppercase tracking-wider text-[9px]">Cambio a Entregar</label>
                  <div className="w-full px-3 py-1.5 border border-transparent rounded-xl bg-amber-50 text-amber-800 font-black text-center text-sm">
                    ${changeValue}
                  </div>
                </div>
              </div>
              
              {/* Preset Quick Cash Buttons */}
              <div className="flex gap-1">
                {[total, 200, 500, 1000].map(val => {
                  const roundedVal = Math.ceil(val);
                  if (roundedVal < total) return null;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCashReceived(String(roundedVal))}
                      className="flex-1 bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 font-bold text-[10px] py-1 rounded-md"
                    >
                      ${roundedVal}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Order Notes */}
          <div className="space-y-1">
            <label className="block font-bold text-gray-500 uppercase tracking-wider text-[10px]">Indicaciones especiales</label>
            <input
              type="text"
              value={transactionNotes}
              onChange={(e) => setTransactionNotes(e.target.value)}
              placeholder="Ej: Mucha mayonesa, sin queso cotija..."
              className="w-full px-3 py-1.5 border border-gray-300 rounded-xl bg-white text-gray-700 focus:outline-none focus:border-[#064E3B]"
            />
          </div>

        </div>

        {/* Price Calculations breakdown */}
        <div className="space-y-1.5 border-t border-gray-100 pt-3 text-xs font-medium">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal:</span>
            <span className="font-mono font-bold">${subtotal.toFixed(2)} MXN</span>
          </div>
          
          {discountAmount > 0 && (
            <div className="flex justify-between text-amber-600">
              <span>Descuento Especial ({discountPercent}%):</span>
              <span className="font-mono font-bold">-${discountAmount.toFixed(2)} MXN</span>
            </div>
          )}

          <div className="flex justify-between text-gray-800 text-sm font-black border-t border-dashed border-gray-100 pt-1.5">
            <span>Total a Cobrar:</span>
            <span className="font-mono text-base text-[#064E3B]">${total.toFixed(2)} MXN</span>
          </div>
        </div>

        {/* Submit checkout buttons */}
        <button
          type="submit"
          disabled={cart.length === 0}
          className={`w-full py-3 text-white font-serif font-black uppercase text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] ${
            cart.length === 0 
              ? 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-none' 
              : 'bg-[#064E3B] hover:bg-[#053F30] cursor-pointer'
          }`}
        >
          <CheckCircle className="w-4.5 h-4.5 text-amber-300" />
          <span>Completar y Generar Ticket</span>
        </button>
      </form>
    );
  };

  return (
    <div className={`w-full transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-40 bg-elote-cream overflow-y-auto p-4 md:p-8' : 'space-y-6'}`}>
      
      {/* Toast alert popup */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border text-xs font-bold ${
              toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
              toast.type === 'info' ? 'bg-indigo-50 border-indigo-200 text-indigo-800' :
              'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POS Top Control Hub */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
              <Coins className="w-3.5 h-3.5" /> POS Elotero
            </span>
            <span className="text-gray-400 font-bold text-[10px] font-mono tracking-wide uppercase">
              Caja 1
            </span>
          </div>
          <h2 className="text-lg md:text-2xl font-black text-[#064E3B] tracking-tight">
            Terminal de Caja Elotera
          </h2>
          <p className="text-xs text-gray-500 hidden sm:block">
            Registra comandas de forma rápida, simula transacciones financieras y descarga el comprobante térmico directo para el comensal.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
          {/* Fullscreen view toggle button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span>Salir de Pantalla Completa</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span>Pantalla Completa POS</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Large products with photo selection buttons */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Filters Row */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
            
            {/* Search Input */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Filtrar por paquete, ingrediente, combo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 bg-white text-xs focus:outline-none focus:border-[#064E3B] font-semibold text-gray-800"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick stats indicator */}
            <div className="shrink-0 hidden sm:flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 text-[#064E3B]">
              <Store className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider">{activeProducts.length} Combos Activos</span>
            </div>
          </div>

          {/* Grid list of Large Products */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-16 text-center text-gray-400">
              <Store className="w-12 h-12 mx-auto mb-3 text-amber-500/50" />
              <p className="font-bold text-gray-700 text-sm">No se encontraron productos disponibles</p>
              <p className="text-xs mt-1">Modifique los términos de búsqueda o verifique en el catálogo que el estado del producto sea &apos;Activo&apos;.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              {filteredProducts.map(product => (
                <motion.div
                  key={product.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="bg-white border border-[#E5E7EB] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
                  onClick={() => addToCart(product)}
                >
                  {/* Large photo area */}
                  <div className="relative h-28 sm:h-44 overflow-hidden bg-gray-100">
                    <img
                      src={getProductImage(product.name)}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Floating Price tag */}
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-[#064E3B] text-white px-2 py-0.5 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-2xl font-serif font-black text-[10px] sm:text-sm tracking-tight shadow-md">
                      ${product.price} MXN
                    </div>

                    {/* Gradient Overlay for visual beauty */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                    {/* Product Name Title bottom aligned */}
                    <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-4 sm:right-4">
                      <span className="text-[8px] sm:text-[10px] font-black text-amber-300 font-mono tracking-widest uppercase block mb-0.5">
                        COMBO
                      </span>
                      <h3 className="text-white font-serif font-black text-xs sm:text-base tracking-wide leading-tight uppercase line-clamp-1">
                        {product.name}
                      </h3>
                    </div>
                  </div>

                  {/* Components checklist summary */}
                  <div className="p-2 sm:p-4 space-y-2 sm:space-y-3 bg-white flex-1 flex flex-col justify-between">
                    <div className="hidden sm:block space-y-1.5 text-xs text-gray-500">
                      <p className="font-bold font-mono text-[9px] uppercase tracking-wider text-gray-400">Incluye en el combo:</p>
                      <div className="max-h-20 overflow-y-auto space-y-1 pr-1 font-medium">
                        {product.items.slice(0, 3).map((it, idx) => (
                          <div key={idx} className="flex items-start gap-1">
                            <span className="text-[#064E3B] font-bold text-[10px]">✓</span>
                            <span className="truncate text-gray-600 text-[11px]">{it}</span>
                          </div>
                        ))}
                        {product.items.length > 3 && (
                          <p className="text-[10px] text-amber-600 font-bold italic">
                            + {product.items.length - 3} componentes más...
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Direct Quick-Add Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // Avoid double triggers
                        addToCart(product);
                      }}
                      className="w-full py-1.5 sm:py-2 bg-[#064E3B] text-white font-serif font-extrabold text-[10px] sm:text-xs uppercase rounded-lg sm:rounded-xl shadow-2xs group-hover:bg-[#065F46] transition-colors flex items-center justify-center gap-1 cursor-pointer mt-1"
                    >
                      <Plus className="w-3 h-3 shrink-0" />
                      <span>Agregar</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Quick simulation banner or instructions */}
          <div className="hidden sm:flex bg-amber-50 border border-amber-200 rounded-2xl p-4 items-center gap-3 text-xs text-amber-900 font-medium">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
            <p>
              <strong>Tip de Operación:</strong> Al hacer clic en cualquiera de las imágenes o tarjetas, se agregará el paquete directamente a la comanda de la derecha para simular el cobro de la sucursal.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Terminal Checkout Drawer (Desktop Only) */}
        <div className="hidden lg:block lg:col-span-4 bg-white border border-[#E5E7EB] rounded-3xl shadow-xs overflow-hidden sticky top-24">
          {/* Header */}
          <div className="bg-[#064E3B] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-300" />
              <h3 className="font-serif font-black text-sm">Comanda Activa</h3>
            </div>
            <span className="bg-amber-500 text-white font-mono text-[10px] font-black px-2.5 py-1 rounded-full">
              {cart.reduce((s, c) => s + c.quantity, 0)} Items
            </span>
          </div>

          <div className="p-4">
            {renderCheckoutForm(false)}
          </div>
        </div>

      </div>

      {/* MOBILE FLOATING CART SUMMARY BUTTON (Mobile Only) */}
      <AnimatePresence>
        {cart.length > 0 && !mobileCartOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-20 left-4 right-4 lg:hidden z-30 shadow-2xl rounded-2xl bg-[#064E3B] text-white p-4 flex items-center justify-between border border-emerald-800"
          >
            <div className="flex items-center gap-3">
              <div className="relative p-2.5 bg-emerald-900 rounded-xl shrink-0">
                <ShoppingCart className="w-5 h-5 text-amber-300" />
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white font-mono text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#064E3B]">
                  {cart.reduce((s, c) => s + c.quantity, 0)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-emerald-300 font-black uppercase tracking-wider">Comanda en Proceso</p>
                <p className="text-sm font-serif font-black tracking-wide truncate">${total.toFixed(2)} MXN</p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setMobileCartOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white font-serif font-black text-xs uppercase px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
            >
              <span>Ver y Cobrar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE SLIDE-UP PAYMENT DRAWER / MODAL */}
      <AnimatePresence>
        {mobileCartOpen && (
          <div className="fixed inset-0 z-50 lg:hidden bg-black/65 backdrop-blur-xs flex items-end justify-center">
            {/* Background click close */}
            <div className="absolute inset-0" onClick={() => setMobileCartOpen(false)} />
            
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col z-10"
            >
              {/* Drawer handle indicator */}
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto my-3 shrink-0" />
              
              {/* Header */}
              <div className="px-5 pb-3 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#064E3B]" />
                  <h3 className="font-serif font-black text-base text-[#064E3B]">Detalle de Venta</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500 text-white font-mono text-[10px] font-black px-2.5 py-1 rounded-full">
                    {cart.reduce((s, c) => s + c.quantity, 0)} Items
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileCartOpen(false)}
                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Form Body */}
              <div className="overflow-y-auto flex-grow p-5 pb-8">
                {renderCheckoutForm(true)}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RECENT SALES LOGS IN AUDITING VIEW */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h3 className="text-sm sm:text-base font-serif font-black text-[#064E3B]">
              Historial del Turno de Ventas
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5 hidden sm:block">
              Visualiza e imprime las comandas de las ventas simuladas durante tu sesión.
            </p>
          </div>

          <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 text-[#064E3B] flex items-center gap-1.5 self-stretch sm:self-auto text-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-black font-mono uppercase tracking-wider">
              Total: ${salesHistory.reduce((s, x) => s + x.total, 0)} MXN
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-100 text-[#064E3B] font-mono text-[9px] font-bold uppercase tracking-wider border-b border-gray-200">
                <th className="py-3 px-4">No. Ticket</th>
                <th className="py-3 px-4 hidden md:table-cell">Fecha / Hora</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4 hidden sm:table-cell">Productos Vendidos</th>
                <th className="py-3 px-4 hidden sm:table-cell">Método Pago</th>
                <th className="py-3 px-4 text-right">Total Cobrado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {salesHistory.map((tx) => (
                <tr key={tx.id} className="hover:bg-amber-500/5 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#064E3B]">{tx.ticketNumber}</td>
                  <td className="py-3 px-4 text-gray-500 font-mono hidden md:table-cell">{tx.timestamp}</td>
                  <td className="py-3 px-4 font-bold text-gray-800">{tx.customerName}</td>
                  <td className="py-3 px-4 text-gray-600 max-w-xs truncate hidden sm:table-cell">
                    {tx.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <span className="px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
                      {tx.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-amber-600">${tx.total} MXN</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setCompletedTransaction(tx)}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-[#064E3B] hover:border-[#064E3B] hover:bg-emerald-50 transition cursor-pointer inline-flex items-center gap-1 font-semibold text-[10px] uppercase"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ver Ticket</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REALISTIC 80mm PRINT TICKET MODAL */}
      <AnimatePresence>
        {completedTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-[#E5E7EB] rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden relative"
            >
              {/* Controls */}
              <div className="absolute top-4 right-4 flex items-center gap-2 z-10 print:hidden">
                <button
                  onClick={handlePrintTicket}
                  className="p-2 rounded-full border border-gray-100 bg-emerald-50 text-[#064E3B] hover:bg-[#064E3B] hover:text-white shadow-xs transition-colors cursor-pointer"
                  title="Imprimir ticket físico"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCompletedTransaction(null)}
                  className="p-2 rounded-full border border-gray-100 bg-white shadow-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  title="Cerrar comanda"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Receipt Area styled exactly like real 80mm thermal paper */}
              <div className="p-6 space-y-6 overflow-y-auto max-h-[85vh] font-mono text-xs text-[#111827] print:p-0 print:text-[10px]">
                
                {/* Brand header */}
                <div className="text-center space-y-2 border-b-2 border-dashed border-gray-300 pb-4">
                  <div className="inline-flex items-center justify-center p-1.5 bg-amber-50 rounded-2xl border border-amber-200">
                    <img 
                      src="https://appdesignproyectos.com/laeloterialogo.png" 
                      alt="Logo Eloteria" 
                      className="w-12 h-12 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <h2 className="text-sm font-black tracking-tight text-[#064E3B] uppercase">LA ELOTERÍA DE ZACATECAS</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Sucursal Vialidad Guadalupe</p>
                    <p className="text-[9px] text-gray-400">Calzada de la Revolución #405</p>
                    <p className="text-[9px] text-gray-400">RFC: EZA-260618-9F0</p>
                  </div>
                </div>

                {/* Ticket general metadata details */}
                <div className="space-y-1.5 border-b-2 border-dashed border-gray-300 pb-3 text-[10px] text-gray-600">
                  <div className="flex justify-between">
                    <span>TICKET NÚM:</span>
                    <span className="font-bold text-[#111827]">{completedTransaction.ticketNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>FECHA:</span>
                    <span className="font-bold">{completedTransaction.timestamp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CAJERO:</span>
                    <span className="font-bold uppercase">{profile.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CLIENTE:</span>
                    <span className="font-bold uppercase">{completedTransaction.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SALA / CANAL:</span>
                    <span className="font-bold uppercase">Consumo Local (Mesa)</span>
                  </div>
                </div>

                {/* Items Bought List */}
                <div className="space-y-3 border-b-2 border-dashed border-gray-300 pb-3">
                  <div className="flex justify-between text-[10px] font-bold text-gray-400">
                    <span>CONCEPTO / CANT</span>
                    <span>IMPORTE</span>
                  </div>
                  
                  {completedTransaction.items.map((it, index) => (
                    <div key={index} className="space-y-0.5">
                      <div className="flex justify-between font-bold text-[#111827]">
                        <span className="uppercase">{it.name}</span>
                        <span>${(it.price * it.quantity).toFixed(2)}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 pl-2">
                        {it.quantity} unidades x ${it.price.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing / Finance accounting breakdown */}
                <div className="space-y-1.5 border-b-2 border-dashed border-gray-300 pb-3">
                  <div className="flex justify-between">
                    <span>SUBTOTAL:</span>
                    <span>${completedTransaction.subtotal.toFixed(2)}</span>
                  </div>

                  {completedTransaction.discount > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>DESCUENTO APLICADO:</span>
                      <span>-${completedTransaction.discount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-black text-[#064E3B] pt-1">
                    <span>TOTAL COMPRA:</span>
                    <span>${completedTransaction.total.toFixed(2)} MXN</span>
                  </div>
                </div>

                {/* Cash payment change detail */}
                <div className="space-y-1.5 text-[10px] text-gray-500">
                  <div className="flex justify-between">
                    <span>MÉTODO DE PAGO:</span>
                    <span className="font-bold uppercase text-[#111827]">{completedTransaction.paymentMethod}</span>
                  </div>

                  {completedTransaction.cashReceived !== undefined && (
                    <>
                      <div className="flex justify-between">
                        <span>EFECTIVO ENTREGADO:</span>
                        <span>${completedTransaction.cashReceived.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[#064E3B] font-bold">
                        <span>CAMBIO DEVOLUCIÓN:</span>
                        <span>${completedTransaction.changeGiven?.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Notes if applicable */}
                {completedTransaction.notes && (
                  <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-lg text-[10px] italic text-gray-500 leading-normal">
                    <strong>Comentarios de preparación:</strong> &quot;{completedTransaction.notes}&quot;
                  </div>
                )}

                {/* Friendly barcode / QR mockup footer */}
                <div className="text-center space-y-3 pt-2">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    *** ¡GRACIAS POR TU COMPRA! ***
                  </p>
                  
                  {/* Mock Barcode pattern using css lines */}
                  <div className="w-48 h-8 mx-auto flex items-stretch gap-0.5 justify-center opacity-65">
                    {[1,2,4,1,2,1,3,1,1,2,4,1,2,1,2,3,1,1,2,1].map((bar, idx) => (
                      <div 
                        key={idx} 
                        className="bg-black shrink-0" 
                        style={{ width: `${bar * 1.5}px` }}
                      ></div>
                    ))}
                  </div>

                  <p className="text-[8px] text-gray-400">
                    Visita laeloteriazacatecas.com para facturación digital.
                  </p>
                </div>

              </div>

              {/* Action trigger footer for easy UX */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2 print:hidden font-sans">
                <button
                  onClick={() => setCompletedTransaction(null)}
                  className="flex-grow border border-gray-200 text-gray-500 hover:bg-gray-100 py-2 rounded-xl text-xs font-bold transition text-center cursor-pointer"
                >
                  Regresar a POS
                </button>

                <button
                  onClick={handlePrintTicket}
                  className="flex-grow bg-[#064E3B] text-white hover:bg-[#053F30] py-2 rounded-xl text-xs font-black uppercase transition text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Ticket</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
