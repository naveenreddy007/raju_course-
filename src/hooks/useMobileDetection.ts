'use client'

import { useState, useEffect } from 'react'

interface ScreenSize {
  width: number
  height: number
}

interface MobileDetection {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  screenSize: ScreenSize
  orientation: 'portrait' | 'landscape'
}

export function useMobileDetection(): MobileDetection {
  const [screenSize, setScreenSize] = useState<ScreenSize>({
    width: 0,
    height: 0,
  })

  useEffect(() => {
    function handleResize() {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    // Set initial size
    handleResize()

    // Add event listener
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = screenSize.width < 768
  const isTablet = screenSize.width >= 768 && screenSize.width < 1024
  const isDesktop = screenSize.width >= 1024
  const orientation = screenSize.width > screenSize.height ? 'landscape' : 'portrait'

  return {
    isMobile,
    isTablet,
    isDesktop,
    screenSize,
    orientation,
  }
}

// Hook for responsive breakpoints
export function useBreakpoint() {
  const { screenSize } = useMobileDetection()

  return {
    isXs: screenSize.width < 475,
    isSm: screenSize.width >= 475 && screenSize.width < 768,
    isMd: screenSize.width >= 768 && screenSize.width < 1024,
    isLg: screenSize.width >= 1024 && screenSize.width < 1280,
    isXl: screenSize.width >= 1280 && screenSize.width < 1536,
    is2Xl: screenSize.width >= 1536,
    screenSize: screenSize.width,
  }
}

// Hook for checking if user is on mobile device (user agent based)
export function useDeviceDetection() {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobileDevice: false,
    isIOS: false,
    isAndroid: false,
    browser: '',
  })

  useEffect(() => {
    const userAgent = navigator.userAgent
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    const isIOS = /iPad|iPhone|iPod/.test(userAgent)
    const isAndroid = /Android/.test(userAgent)

    let browser = 'Unknown'
    if (userAgent.indexOf('Chrome') > -1) browser = 'Chrome'
    else if (userAgent.indexOf('Safari') > -1) browser = 'Safari'
    else if (userAgent.indexOf('Firefox') > -1) browser = 'Firefox'
    else if (userAgent.indexOf('Edge') > -1) browser = 'Edge'

    setDeviceInfo({
      isMobileDevice,
      isIOS,
      isAndroid,
      browser,
    })
  }, [])

  return deviceInfo
}