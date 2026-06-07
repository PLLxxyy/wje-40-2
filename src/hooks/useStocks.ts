import { useState, useEffect, useCallback, useRef } from 'react';
import { Stock, KLineData, TickData, OrderBookLevel, KLinePeriod } from '../types';
import { generateStocks, updateStocks, generateKLine, generateTicks, generateOrderBook, appendTick } from '../utils/mockData';

export function useStocks(refreshInterval = 2000) {
  const [stocks, setStocks] = useState<Stock[]>(() => generateStocks());
  const [selectedCode, setSelectedCode] = useState<string>('000001');
  const [period, setPeriod] = useState<KLinePeriod>('day');
  const [kline, setKline] = useState<KLineData[]>([]);
  const [ticks, setTicks] = useState<TickData[]>([]);
  const [orderBook, setOrderBook] = useState<{ bids: OrderBookLevel[]; asks: OrderBookLevel[] }>({ bids: [], asks: [] });
  const ticksRef = useRef<TickData[]>([]);

  const selectedStock = stocks.find((s) => s.code === selectedCode) || stocks[0];

  useEffect(() => {
    setKline(generateKLine(selectedCode, period));
    const newTicks = generateTicks(selectedCode);
    setTicks(newTicks);
    ticksRef.current = newTicks;
    setOrderBook(generateOrderBook(selectedStock?.price || 100));
  }, [selectedCode, period]);

  const refresh = useCallback(() => {
    setStocks((prev) => {
      const updated = updateStocks(prev);
      const sel = updated.find((s) => s.code === selectedCode);
      const prevSel = prev.find((s) => s.code === selectedCode);
      if (sel) {
        setOrderBook(generateOrderBook(sel.price));
        const volumeDelta = prevSel ? sel.volume - prevSel.volume : 0;
        const newTicks = appendTick(ticksRef.current, sel.price, volumeDelta);
        ticksRef.current = newTicks;
        setTicks(newTicks);
      }
      return updated;
    });
  }, [selectedCode]);

  useEffect(() => {
    const timer = setInterval(refresh, refreshInterval);
    return () => clearInterval(timer);
  }, [refresh, refreshInterval]);

  return {
    stocks,
    selectedStock,
    selectedCode,
    setSelectedCode,
    period,
    setPeriod,
    kline,
    ticks,
    orderBook,
  };
}
