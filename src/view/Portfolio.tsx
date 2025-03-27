'use client'

import { useWebSocket } from "@/hooks/useWebSocket";
import { useRef } from "react";

export const Portfolio = () => {

	const { data, isConnected } = useWebSocket()

	console.log('data', data)


	return (
		<main>

		</main>
	);
};
