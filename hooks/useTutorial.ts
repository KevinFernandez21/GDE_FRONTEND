import { useState, useEffect } from 'react'

interface TutorialState {
  isOpen: boolean
  hasCompleted: boolean
  completionDate: string | null
}

export const useTutorial = (userRole?: string) => {
  const [tutorialState, setTutorialState] = useState<TutorialState>({
    isOpen: false,
    hasCompleted: false,
    completionDate: null
  })

  useEffect(() => {
    // Solo mostrar tutorial para usuarios contadores
    if (userRole !== 'contador') {
      return
    }

    const hasCompleted = localStorage.getItem('tutorial_completed') === 'true'
    const completionDate = localStorage.getItem('tutorial_completion_date')

    setTutorialState({
      isOpen: !hasCompleted,
      hasCompleted,
      completionDate
    })
  }, [userRole])

  const openTutorial = () => {
    setTutorialState(prev => ({ ...prev, isOpen: true }))
  }

  const closeTutorial = () => {
    setTutorialState(prev => ({ ...prev, isOpen: false }))
  }

  const completeTutorial = () => {
    const now = new Date().toISOString()
    localStorage.setItem('tutorial_completed', 'true')
    localStorage.setItem('tutorial_completion_date', now)

    setTutorialState({
      isOpen: false,
      hasCompleted: true,
      completionDate: now
    })
  }

  const resetTutorial = () => {
    localStorage.removeItem('tutorial_completed')
    localStorage.removeItem('tutorial_completion_date')

    setTutorialState({
      isOpen: true,
      hasCompleted: false,
      completionDate: null
    })
  }

  return {
    ...tutorialState,
    openTutorial,
    closeTutorial,
    completeTutorial,
    resetTutorial
  }
}