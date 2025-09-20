import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Modal from './components/Modal';
import GamePanel from './components/GamePanel';
import { GameState } from './types';
import type { EndOfDayReportData, InventoryItem, ForSaleItem, Product } from './types';
import { INITIAL_MONEY, INITIAL_DAY, PRODUCTS } from './constants';

// Helper to get a random item from an array
const getRandomItem = <T,>(arr: T[]): T | undefined => {
    if (arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
};


const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(GameState.START_MENU);
    const [day, setDay] = useState(INITIAL_DAY);
    const [money, setMoney] = useState(INITIAL_MONEY);
    const [inventory, setInventory] = useState<Map<string, InventoryItem>>(new Map());
    const [forSale, setForSale] = useState<Map<string, ForSaleItem>>(new Map());
    const [dailyExpenses, setDailyExpenses] = useState(0); // Only for purchases
    const [supplierPrices, setSupplierPrices] = useState<Map<string, number>>(new Map());
    const [endOfDayReport, setEndOfDayReport] = useState<EndOfDayReportData | null>(null);
    const [log, setLog] = useState<string[]>([]);
    
    // State for new features
    const [simulationResult, setSimulationResult] = useState<{ revenue: number; salesSummary: EndOfDayReportData['salesSummary']; newForSale: Map<string, ForSaleItem> } | null>(null);
    const [thiefEvent, setThiefEvent] = useState<{ productId: string; productName: string; quantity: number } | null>(null);
    const [electricityBill, setElectricityBill] = useState(0);

    // State for cheat codes
    const [isCheatModalOpen, setIsCheatModalOpen] = useState(false);
    const [activeCheats, setActiveCheats] = useState<Set<string>>(new Set());
    const [cheatCodeInput, setCheatCodeInput] = useState('');

    const productMap = useMemo(() => new Map(PRODUCTS.map(p => [p.id, p])), []);

    const updateSupplierPrices = useCallback(() => {
        const newPrices = new Map<string, number>();
        PRODUCTS.forEach(product => {
            const priceFluctuation = (Math.random() - 0.5) * 0.4; // +/- 20%
            const newPrice = Math.max(1, product.basePrice * (1 + priceFluctuation));
            newPrices.set(product.id, parseFloat(newPrice.toFixed(2)));
        });
        setSupplierPrices(newPrices);
    }, []);

    useEffect(() => {
        if (gameState === GameState.PLAYING && supplierPrices.size === 0) {
            updateSupplierPrices();
        }
    }, [gameState, supplierPrices, updateSupplierPrices]);
    
    const addToLog = (message: string) => {
        setLog(prev => [`${day}. Gün: ${message}`, ...prev.slice(0, 100)]);
    };

    const handleApplyCheat = () => {
        const code = cheatCodeInput.trim().toLowerCase();
        if (code === 'babapro') {
            setActiveCheats(prev => new Set(prev).add('INFINITE_MONEY'));
            alert('Hile Aktif: Sonsuz Para!');
            setIsCheatModalOpen(false);
            setCheatCodeInput('');
        } else {
            alert('Geçersiz Hile Kodu!');
        }
    };

    const startGame = () => {
        setDay(INITIAL_DAY);
        const startMoney = activeCheats.has('INFINITE_MONEY') ? Infinity : INITIAL_MONEY;
        setMoney(startMoney);
        setInventory(new Map());
        setForSale(new Map());
        setDailyExpenses(0);
        setLog(['Market Simülatörüne hoş geldin! Dükkanını aç ve para kazanmaya başla.']);
        if (activeCheats.has('INFINITE_MONEY')) {
            addToLog('"Babapro" hile kodu aktif. Sonsuz parayla oynuyorsun!');
        }
        updateSupplierPrices();
        setGameState(GameState.PLAYING);
    };

    const handleBuy = useCallback((product: Product, quantity: number) => {
        const price = supplierPrices.get(product.id) ?? product.basePrice;
        const cost = quantity * price;

        if (money < cost) {
            addToLog(`Yetersiz bakiye: ${product.name} almak için yeterli paran yok.`);
            return;
        }

        setMoney(prev => prev - cost);
        setDailyExpenses(prev => prev + cost);
        setInventory(prev => {
            const newInv = new Map(prev);
            const currentItem = newInv.get(product.id) || { productId: product.id, quantity: 0 };
            currentItem.quantity += quantity;
            newInv.set(product.id, currentItem);
            return newInv;
        });
        addToLog(`${quantity} adet ${product.name} satın alındı (${cost.toFixed(2)} ₺).`);
    }, [money, supplierPrices]);

    const handleSetPrice = useCallback((item: InventoryItem, sellQuantity: number, sellPrice: number) => {
        if (sellQuantity <= 0 || sellPrice <= 0) return;

        const actualSellQuantity = Math.min(item.quantity, sellQuantity);

        setInventory(prev => {
            const newInv = new Map(prev);
            const invItem = newInv.get(item.productId);
            if (invItem) {
                invItem.quantity -= actualSellQuantity;
                if (invItem.quantity <= 0) {
                    newInv.delete(item.productId);
                } else {
                    newInv.set(item.productId, invItem);
                }
            }
            return newInv;
        });

        setForSale(prev => {
            const newForSale = new Map(prev);
            const saleItem = newForSale.get(item.productId) || { productId: item.productId, quantity: 0, sellingPrice: sellPrice };
            saleItem.quantity += actualSellQuantity;
            saleItem.sellingPrice = sellPrice;
            newForSale.set(item.productId, saleItem);
            return newForSale;
        });
        const productName = productMap.get(item.productId)?.name || 'Ürün';
        addToLog(`${actualSellQuantity} adet ${productName}, ${sellPrice.toFixed(2)} ₺ fiyatla satışa çıkarıldı.`);
    }, [productMap]);

    const finalizeDay = useCallback((revenue: number, salesSummary: EndOfDayReportData['salesSummary'], finalForSale: Map<string, ForSaleItem>, bill: number) => {
        setForSale(finalForSale);
        const totalExpenses = dailyExpenses + bill;
        const profit = revenue - totalExpenses;

        setEndOfDayReport({
            day,
            revenue,
            expenses: totalExpenses,
            profit,
            electricityBill: bill,
            salesSummary
        });
        
        const newMoney = money + profit;
        setMoney(newMoney);
        
        if (newMoney < 0) {
            setGameState(GameState.GAME_OVER);
        } else {
            setGameState(GameState.END_DAY_REPORT);
        }
    }, [day, dailyExpenses, money]);

    const handleEndDay = useCallback(() => {
        setGameState(GameState.SIMULATING);
        addToLog("Gün sonu... Müşteriler geliyor...");

        setTimeout(() => {
            let revenue = 0;
            const salesSummary: EndOfDayReportData['salesSummary'] = [];
            const newForSale = new Map(forSale);

            newForSale.forEach((item, productId) => {
                const product = productMap.get(productId);
                if (!product) return;

                const priceAttractiveness = (product.basePrice * 1.5) / item.sellingPrice;
                const potentialDemand = product.baseDemand * priceAttractiveness * (0.75 + Math.random() * 0.5);
                const sales = Math.min(item.quantity, Math.floor(potentialDemand));
                
                if (sales > 0) {
                    const saleRevenue = sales * item.sellingPrice;
                    revenue += saleRevenue;
                    item.quantity -= sales;
                    salesSummary.push({ productName: product.name, quantity: sales, revenue: saleRevenue });
                }

                if (item.quantity <= 0) {
                    newForSale.delete(productId);
                } else {
                    newForSale.set(productId, item);
                }
            });

            const simResult = { revenue, salesSummary, newForSale };
            setSimulationResult(simResult);

            const currentElectricityBill = 20 + day * 1.5 + Math.random() * 15;
            setElectricityBill(currentElectricityBill);
            addToLog(`Elektrik faturası geldi: ${currentElectricityBill.toFixed(2)} ₺`);
            
            const stockAvailable = Array.from(inventory.values()).some(i => i.quantity > 0) || Array.from(newForSale.values()).some(i => i.quantity > 0);
            if (stockAvailable && Math.random() < 0.20) {
                addToLog("Dükkana bir hırsız girdi!");
                
                const allStock = [...Array.from(inventory.values()), ...Array.from(newForSale.values())];
                const targetItem = getRandomItem(allStock.filter(i => i.quantity > 0));

                if (targetItem) {
                    const product = productMap.get(targetItem.productId);
                    setThiefEvent({
                        productId: targetItem.productId,
                        productName: product?.name || 'Bilinmeyen Ürün',
                        quantity: Math.min(targetItem.quantity, Math.ceil(targetItem.quantity * 0.5))
                    });
                    setGameState(GameState.THIEF_EVENT);
                } else {
                     finalizeDay(simResult.revenue, simResult.salesSummary, simResult.newForSale, currentElectricityBill);
                }
            } else {
                finalizeDay(simResult.revenue, simResult.salesSummary, simResult.newForSale, currentElectricityBill);
            }
        }, 2000);
    }, [day, forSale, inventory, productMap, finalizeDay]);

    const handleThiefInteraction = useCallback((didCatch: boolean, letGo: boolean = false) => {
        if (!thiefEvent || !simulationResult) return;

        let stolenQuantity = 0;
        const { productId, quantity, productName } = thiefEvent;

        if (letGo) {
            stolenQuantity = Math.max(1, Math.floor(quantity / 3));
            addToLog(`Hırsızın gitmesine izin verdin. ${stolenQuantity} adet ${productName} çaldı.`);
        } else if (didCatch) {
            addToLog(`Başardın! Hırsızı yakaladın ve hiçbir şey çalamadı.`);
        } else {
            stolenQuantity = quantity;
            addToLog(`Hırsızı yakalayamadın! ${stolenQuantity} adet ${productName} çaldı.`);
        }
        
        if (stolenQuantity > 0) {
             const newForSale = new Map(simulationResult.newForSale);
             const saleItem = newForSale.get(productId);
             if (saleItem && saleItem.quantity >= stolenQuantity) {
                 saleItem.quantity -= stolenQuantity;
                 if(saleItem.quantity <= 0) newForSale.delete(productId);
                 setSimulationResult({...simulationResult, newForSale});
             } else {
                 let remainingToSteal = stolenQuantity;
                 if (saleItem) {
                     remainingToSteal -= saleItem.quantity;
                     newForSale.delete(productId);
                     setSimulationResult({...simulationResult, newForSale});
                 }
                 setInventory(prev => {
                     const newInv = new Map(prev);
                     const invItem = newInv.get(productId);
                     if (invItem) {
                         invItem.quantity = Math.max(0, invItem.quantity - remainingToSteal);
                          if(invItem.quantity <= 0) newInv.delete(productId);
                     }
                     return newInv;
                 });
             }
        }
        
        setThiefEvent(null);
        finalizeDay(simulationResult.revenue, simulationResult.salesSummary, simulationResult.newForSale, electricityBill);

    }, [thiefEvent, simulationResult, electricityBill, finalizeDay]);
    
    const handleStartNewDay = useCallback(() => {
        setDay(prev => prev + 1);
        setDailyExpenses(0);
        setEndOfDayReport(null);
        setLog(prev => [`${day + 1}. gün başladı! Bol kazançlar!`, ...prev.slice(0, 50)]);
        
        if (forSale.size > 0) {
            setInventory(prevInv => {
                const newInv = new Map(prevInv);
                forSale.forEach((saleItem, productId) => {
                    const invItem = newInv.get(productId) || { productId, quantity: 0 };
                    invItem.quantity += saleItem.quantity;
                    newInv.set(productId, invItem);
                });
                return newInv;
            });
            setForSale(new Map());
            addToLog("Satılmayan ürünler envantere geri eklendi.");
        }

        updateSupplierPrices();
        setGameState(GameState.PLAYING);
    }, [day, forSale, updateSupplierPrices]);
    
    const ProductCard: React.FC<{
        product: Product;
        price: number;
        onAction: (quantity: number) => void;
        actionLabel: string;
        buttonColor: string;
    }> = ({ product, price, onAction, actionLabel, buttonColor }) => {
        const [quantity, setQuantity] = useState(1);
        return (
             <div className="bg-slate-700/50 p-3 rounded-lg flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">{product.icon}</span>
                    <div>
                        <p className="font-bold">{product.name}</p>
                        <p className="text-sm text-yellow-400">{price.toFixed(2)} ₺</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 bg-slate-900 border border-slate-600 rounded p-1 text-center"
                    />
                    <button onClick={() => onAction(quantity)} className={`px-3 py-1 text-sm font-bold rounded ${buttonColor} hover:opacity-90 transition-opacity`}>
                        {actionLabel}
                    </button>
                </div>
            </div>
        );
    }
    
    const InventoryCard: React.FC<{
        item: InventoryItem;
        onAction: (sellQuantity: number, sellPrice: number) => void;
    }> = ({ item, onAction }) => {
        const product = productMap.get(item.productId);
        const [sellQuantity, setSellQuantity] = useState(1);
        const [sellPrice, setSellPrice] = useState(product ? (product.basePrice * 1.5).toFixed(2) : '0');
        if (!product) return null;

        return (
            <div className="bg-slate-700/50 p-3 rounded-lg mb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{product.icon}</span>
                        <div>
                            <p className="font-bold">{product.name}</p>
                            <p className="text-sm text-slate-400">Stok: {item.quantity}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <input type="number" min="1" max={item.quantity} value={sellQuantity} onChange={e => setSellQuantity(Math.max(1, Math.min(item.quantity, parseInt(e.target.value) || 1)))} className="w-16 bg-slate-900 border border-slate-600 rounded p-1 text-center" placeholder="Adet"/>
                    <input type="number" min="0.01" step="0.01" value={sellPrice} onChange={e => setSellPrice(e.target.value)} className="w-20 bg-slate-900 border border-slate-600 rounded p-1 text-center" placeholder="Fiyat"/>
                     <span className="text-slate-400">₺</span>
                    <button onClick={() => onAction(sellQuantity, parseFloat(sellPrice) || 0)} className="flex-grow px-3 py-1 text-sm font-bold rounded bg-green-600 hover:bg-green-500 transition-colors">
                        Satışa Çıkar
                    </button>
                </div>
            </div>
        );
    }

    if (gameState === GameState.START_MENU) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white">
                <div className="text-center p-8 bg-slate-800 rounded-xl shadow-2xl border border-slate-700">
                    <h1 className="text-5xl font-extrabold mb-4 text-cyan-400">Market Simülatörü</h1>
                    <p className="text-slate-300 mb-8 max-w-md">Kendi marketini yönet, ürün alıp sat ve en büyük market zinciri olmaya çalış!</p>
                    <button onClick={startGame} className="px-10 py-4 bg-indigo-600 text-white font-bold text-xl rounded-full hover:bg-indigo-500 transition-all duration-200 transform hover:scale-110 shadow-lg">
                        Oyuna Başla
                    </button>
                    <button onClick={() => setIsCheatModalOpen(true)} className="mt-4 text-sm text-slate-500 hover:text-cyan-400 transition-colors">
                        Kod Gir
                    </button>
                </div>

                <Modal isOpen={isCheatModalOpen} onClose={() => setIsCheatModalOpen(false)} title="Hile Kodu Gir">
                    <div className="flex flex-col gap-4">
                        <p className="text-slate-300">Bir hile kodun varsa, şimdi tam zamanı!</p>
                        <input
                            type="text"
                            value={cheatCodeInput}
                            onChange={(e) => setCheatCodeInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyCheat()}
                            placeholder="Örn: Babapro"
                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-center text-white"
                        />
                        <button onClick={handleApplyCheat} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 transition-colors">
                            Kodu Uygula
                        </button>
                    </div>
                </Modal>
            </div>
        );
    }
    
    return (
        <div className="p-4 max-w-7xl mx-auto font-sans">
            <Header day={day} money={money} onEndDay={handleEndDay} gameState={gameState} />

            <main className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
                <GamePanel title="Tedarikçi" icon="🛒">
                    {PRODUCTS.map(p => (
                        <ProductCard 
                            key={p.id}
                            product={p}
                            price={supplierPrices.get(p.id) ?? 0}
                            onAction={(q) => handleBuy(p, q)}
                            actionLabel="Satın Al"
                            buttonColor="bg-blue-600"
                        />
                    ))}
                </GamePanel>
                
                <GamePanel title="Dükkanım" icon="🏪">
                    <h3 className="font-bold mb-2 text-slate-300">Envanter</h3>
                    <div className="mb-4 border-b border-slate-700 pb-4">
                        {inventory.size > 0 ? Array.from(inventory.values()).map(item => (
                            <InventoryCard key={item.productId} item={item} onAction={(sellQuantity, sellPrice) => handleSetPrice(item, sellQuantity, sellPrice)} />
                        )) : <p className="text-slate-500 italic text-sm">Envanterin boş.</p>}
                    </div>
                    
                    <h3 className="font-bold mb-2 text-slate-300">Satıştaki Ürünler</h3>
                     <div>
                        {forSale.size > 0 ? Array.from(forSale.values()).map(item => {
                            const product = productMap.get(item.productId);
                            if (!product) return null;
                            return (
                               <div key={item.productId} className="bg-slate-700/50 p-3 rounded-lg flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{product.icon}</span>
                                        <div>
                                            <p className="font-bold">{product.name}</p>
                                            <p className="text-sm text-green-400">{item.quantity} adet @ {item.sellingPrice.toFixed(2)} ₺</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : <p className="text-slate-500 italic text-sm">Satışta ürün yok.</p>}
                    </div>
                </GamePanel>
                
                <GamePanel title="Günlük Rapor" icon="📜">
                    <div className="flex flex-col-reverse">
                        {log.map((entry, index) => (
                             <p key={index} className={`text-sm mb-2 p-2 rounded ${index === 0 ? 'bg-slate-700/80 animate-pulse-once' : 'bg-slate-700/30'}`}>
                                {entry}
                            </p>
                        ))}
                    </div>
                </GamePanel>
            </main>

            <Modal isOpen={gameState === GameState.END_DAY_REPORT && !!endOfDayReport} onClose={handleStartNewDay} title={`Gün ${endOfDayReport?.day} Raporu`}>
                 {endOfDayReport && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                           <div className="bg-slate-700 p-3 rounded-lg"><p className="text-slate-400 text-sm">Toplam Gelir</p><p className="text-xl font-bold text-green-400">{endOfDayReport.revenue.toFixed(2)} ₺</p></div>
                           <div className="bg-slate-700 p-3 rounded-lg">
                                <p className="text-slate-400 text-sm">Toplam Gider</p>
                                <p className="text-xl font-bold text-red-400">{endOfDayReport.expenses.toFixed(2)} ₺</p>
                                <p className="text-xs text-slate-500 mt-1">Alımlar: {(endOfDayReport.expenses - endOfDayReport.electricityBill).toFixed(2)} ₺</p>
                                <p className="text-xs text-slate-500">Elektrik: {endOfDayReport.electricityBill.toFixed(2)} ₺</p>
                           </div>
                           <div className="bg-slate-700 p-3 rounded-lg"><p className="text-slate-400 text-sm">Günlük Kâr</p><p className={`text-xl font-bold ${endOfDayReport.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{endOfDayReport.profit.toFixed(2)} ₺</p></div>
                        </div>
                        <div>
                            <h4 className="font-bold mb-2">Satış Özeti:</h4>
                            <ul className="space-y-1 max-h-48 overflow-y-auto pr-2">
                                {endOfDayReport.salesSummary.length > 0 ? endOfDayReport.salesSummary.map((sale, i) => (
                                    <li key={i} className="flex justify-between bg-slate-700/50 p-2 rounded">
                                        <span>{sale.quantity} x {sale.productName}</span>
                                        <span className="font-semibold text-green-500">+{sale.revenue.toFixed(2)} ₺</span>
                                    </li>
                                )) : <p className="text-slate-500 italic">Bugün hiç satış olmadı.</p>}
                            </ul>
                        </div>
                        <button onClick={handleStartNewDay} className="w-full mt-4 px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 transition-colors">
                            Yeni Güne Başla
                        </button>
                    </div>
                )}
            </Modal>
            
            <Modal isOpen={gameState === GameState.THIEF_EVENT} onClose={() => {}} title="Hırsız!">
                {thiefEvent && (
                    <div className="text-center space-y-4">
                        <p className="text-2xl">🚨</p>
                        <p className="text-lg">Bir hırsız dükkanına girdi ve <span className="font-bold text-yellow-400">{thiefEvent.quantity} adet {thiefEvent.productName}</span> çalmaya çalışıyor!</p>
                        <p>Ne yapacaksın?</p>
                        <div className="flex justify-center gap-4 pt-4">
                             <button onClick={() => handleThiefInteraction(Math.random() < 0.5)} className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-500 transition-colors">
                                Hırsızı Yakalamayı Dene (%50 Şans)
                            </button>
                             <button onClick={() => handleThiefInteraction(false, true)} className="px-6 py-3 bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-500 transition-colors">
                                Bırak Gitsin (Az Kayıp)
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
            
            <Modal isOpen={gameState === GameState.GAME_OVER} onClose={startGame} title="Oyun Bitti">
                <div className="text-center space-y-4">
                    <p className="text-xl">İflas ettin! Ama pes etme, her zaman yeniden deneyebilirsin.</p>
                     <button onClick={startGame} className="w-full mt-4 px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 transition-colors">
                        Yeniden Oyna
                    </button>
                </div>
            </Modal>

            {gameState === GameState.SIMULATING && (
                <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-50">
                    <div className="loader ease-linear rounded-full border-8 border-t-8 border-slate-500 h-24 w-24 mb-4"></div>
                    <p className="text-xl text-white">Gün simüle ediliyor...</p>
                </div>
            )}
             <style>{`
                .loader { border-top-color: #3498db; animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse-once {
                    0%, 100% { background-color: rgba(51, 65, 85, 0.3); }
                    50% { background-color: rgba(51, 65, 85, 0.8); }
                }
                .animate-pulse-once { animation: pulse-once 1.5s ease-in-out; }
             `}</style>
        </div>
    );
};

export default App;