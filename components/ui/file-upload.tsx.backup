"use client"

import React, { useState, useRef, useCallback } from 'react'
import { Upload, X, File, Image, FileText, Download, Trash2, Eye } from 'lucide-react'
import { Button } from './button'
import { Progress } from './progress'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { useToast } from './use-toast'

interface FileItem {
  id: string
  name: string
  size: number
  type: string
  status: 'uploading' | 'completed' | 'error'
  progress: number
  file?: File
  url?: string
}

interface FileUploadProps {
  accept?: string
  multiple?: boolean
  maxSize?: number
  maxFiles?: number
  uploadType: string
  onUploadComplete?: (files: FileItem[]) => void
  onFileRemove?: (fileId: string) => void
  className?: string
  disabled?: boolean
  relatedTable?: string
  relatedId?: string
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension || '')) {
    return <Image className="h-4 w-4" />
  }
  if (['pdf'].includes(extension || '')) {
    return <FileText className="h-4 w-4" />
  }
  if (['xls', 'xlsx', 'csv'].includes(extension || '')) {
    return <FileText className="h-4 w-4 text-green-600" />
  }
  return <File className="h-4 w-4" />
}

export function FileUpload({
  accept = "*/*",
  multiple = true,
  maxSize = 50 * 1024 * 1024, // 50MB
  maxFiles = 10,
  uploadType,
  onUploadComplete,
  onFileRemove,
  className = "",
  disabled = false,
  relatedTable,
  relatedId
}: FileUploadProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_type', uploadType)
    
    if (relatedTable) {
      formData.append('related_table', relatedTable)
    }
    if (relatedId) {
      formData.append('related_id', relatedId)
    }

    // TODO: Implement file upload endpoint in backend
    throw new Error('File upload functionality not yet implemented in backend')

    /* const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    const result = await response.json()
    return result.data.file_id
  }

  const handleFiles = useCallback(async (newFiles: File[]) => {
    if (disabled) return

    // Validate file count
    if (files.length + newFiles.length > maxFiles) {
      toast({
        title: "Demasiados archivos",
        description: `Solo puedes subir un máximo de ${maxFiles} archivos.`,
        variant: "destructive"
      })
      return
    }

    // Validate and prepare files
    const validFiles = newFiles.filter(file => {
      if (file.size > maxSize) {
        toast({
          title: "Archivo muy grande",
          description: `${file.name} excede el tamaño máximo de ${formatFileSize(maxSize)}.`,
          variant: "destructive"
        })
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    // Create file items
    const newFileItems: FileItem[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0,
      file
    }))

    setFiles(prev => [...prev, ...newFileItems])

    // Upload files
    const uploadPromises = newFileItems.map(async (fileItem) => {
      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          ))
        }, 200)

        const fileId = await uploadFile(fileItem.file!)
        
        clearInterval(progressInterval)
        
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'completed', progress: 100, url: `/api/v1/files/${fileId}/download` }
            : f
        ))

        toast({
          title: "Archivo subido",
          description: `${fileItem.name} se subió correctamente.`
        })

      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'error', progress: 0 }
            : f
        ))

        toast({
          title: "Error al subir archivo",
          description: `No se pudo subir ${fileItem.name}.`,
          variant: "destructive"
        })
      }
    })

    await Promise.all(uploadPromises)
    
    const completedFiles = files.filter(f => f.status === 'completed')
    if (onUploadComplete && completedFiles.length > 0) {
      onUploadComplete(completedFiles)
    }
  }, [files, maxFiles, maxSize, uploadType, relatedTable, relatedId, disabled, toast, onUploadComplete])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      handleFiles(selectedFiles)
    }
    // Clear the input value so the same file can be selected again
    e.target.value = ''
  }, [handleFiles])

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    if (onFileRemove) {
      onFileRemove(fileId)
    }
  }

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const downloadFile = (file: FileItem) => {
    if (file.url) {
      const link = document.createElement('a')
      link.href = file.url
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const previewFile = (file: FileItem) => {
    if (file.url && file.type.startsWith('image/')) {
      window.open(file.url, '_blank')
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900">
          {isDragging ? 'Suelta los archivos aquí' : 'Arrastra archivos aquí o haz clic para seleccionar'}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          {multiple ? `Hasta ${maxFiles} archivos` : 'Un archivo'} • Máximo {formatFileSize(maxSize)} cada uno
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Archivos ({files.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {files.map((file) => (
              <div key={file.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  {getFileIcon(file.name)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                  
                  {file.status === 'uploading' && (
                    <div className="mt-2">
                      <Progress value={file.progress} className="h-1" />
                      <p className="text-xs text-gray-500 mt-1">
                        Subiendo... {file.progress}%
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0">
                  <Badge
                    variant={
                      file.status === 'completed' ? 'default' :
                      file.status === 'uploading' ? 'secondary' : 'destructive'
                    }
                  >
                    {file.status === 'completed' ? 'Completado' :
                     file.status === 'uploading' ? 'Subiendo' : 'Error'}
                  </Badge>
                </div>

                <div className="flex-shrink-0 flex space-x-1">
                  {file.status === 'completed' && (
                    <>
                      {file.type.startsWith('image/') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => previewFile(file)}
                          className="p-1 h-6 w-6"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadFile(file)}
                        className="p-1 h-6 w-6"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="p-1 h-6 w-6 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}