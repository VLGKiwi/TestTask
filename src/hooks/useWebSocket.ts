'use client'

import { tradingPairs } from '@/data/tradingPairs'
import { useEffect, useRef, useState } from "react"

export const useWebSocket = () => {
	const [isConnected, setIsConnected] = useState<boolean>(false)
	const [data, setData] = useState<any>(null)

	const ws = useRef<WebSocket | null>(null)
	// Задание интервала для пинга
	const pingInterval = useRef<NodeJS.Timeout | null>(null)
	// Задание таймаута для понга
	const pingTimeout = useRef<NodeJS.Timeout | null>(null)

	useEffect(() => {
		// Подключение к серверу
		const connect = () => {
			ws.current = new WebSocket(`wss://stream.binance.com:443/stream?streams`)

			ws.current.onopen = handleOpen
			ws.current.onmessage = handleMessage
			ws.current.onclose = handleClose
			ws.current.onerror = handleError
		}

		// Открытие сервера
		const handleOpen = () => {
			setIsConnected(true)

			try {
        if (ws.current?.readyState === WebSocket.OPEN) {
					ws.current.send(JSON.stringify({
						method: "SUBSCRIBE",
						params: tradingPairs.map(pair => `${pair.toLowerCase()}@ticker`),
						id: Date.now()
					}));
        }
			} catch (error) {
				console.error('Ошибка при отправке подписки:', error);
			}

			startPing()
		}

		// Получение данных и понга с сервера
		const handleMessage = (event: MessageEvent) => {
			try {
				const recievedData = JSON.parse(event.data)

				if (recievedData.result !== undefined) {

					// Очищаем таймер ожидания понга, если он не очищен
					if (pingTimeout.current) {
						clearTimeout(pingTimeout.current)
					}
					return
				}

				setData(recievedData.data)

			} catch (error) {
				console.log('Ошибка в Message: ', error)
			}
		}

		// Закрытие сервера
		const handleClose = () => {
			setIsConnected(false)
			cleanup()
			recconet()
		}

		// Вывод ошибки Вебсокета
		const handleError = (event: Event) => {
			console.log('WebSocket error', event)
			handleClose()
		}

		const heartbeat = () => {
			if (pingTimeout.current) {
				clearTimeout(pingTimeout.current)
			}

			pingTimeout.current = setTimeout(() => {
				if (ws.current?.readyState === WebSocket.OPEN) {
					ws.current.close()
				}
			}, 5000)
		}

		// Запуск пинга для поддержания сервера
		const startPing = () => {
			pingInterval.current = setInterval(() => {
				if (ws.current?.readyState === WebSocket.OPEN) {
					ws.current.send(JSON.stringify({
						method: "LIST_SUBSCRIPTIONS",
						id: Date.now()
					}));
					heartbeat()
				}
			}, 30000)
		}

		// Отчистка интервала для пинга
		const cleanup = () => {
			clearInterval(pingInterval.current!)
		}

		// Переподключение к серверу
		const recconet = () => {
			setTimeout(connect, 5000)
		}

		// Запуск сервера
		connect()

		// Очищаем
		return () => { cleanup(); ws.current?.close() }
	}, [])

	return {data, isConnected}
}
