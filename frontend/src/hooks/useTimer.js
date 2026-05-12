import { useState, useEffect, useCallback, useRef } from 'react'

export function useTimer(initialTime = 0) {
  const [time, setTime] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef(null)
  const startTimeRef = useRef(null)

  const start = useCallback(() => {
    if (!isRunning) {
      startTimeRef.current = Date.now() - time * 1000
      setIsRunning(true)
    }
  }, [isRunning, time])

  const stop = useCallback(() => {
    setIsRunning(false)
    return time
  }, [time])

  const reset = useCallback(() => {
    setIsRunning(false)
    setTime(0)
    startTimeRef.current = null
  }, [])

  const getElapsedTime = useCallback(() => {
    return time
  }, [time])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setTime(elapsed)
      }, 100)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  const formatTime = useCallback((seconds = time) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [time])

  return {
    time,
    isRunning,
    start,
    stop,
    reset,
    formatTime,
    getElapsedTime
  }
}

export default useTimer
