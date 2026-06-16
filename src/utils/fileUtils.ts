import Taro from '@tarojs/taro';

export const isImageFile = (fileName: string): boolean => {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
};

export const formatFileSize = (size: number): string => {
  if (!size || size <= 0) return '未知';
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
  return `${(size / (1024 * 1024)).toFixed(1)}MB`;
};

export const getFileTypeLabel = (fileName: string): string => {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  const map: Record<string, string> = {
    pdf: 'PDF', doc: 'Word', docx: 'Word', xls: 'Excel', xlsx: 'Excel',
    jpg: '图片', jpeg: '图片', png: '图片', gif: '图片', bmp: '图片', webp: '图片',
  };
  return map[ext] || ext.toUpperCase();
};

export const isPdfFile = (fileName: string): boolean => {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  return ext === 'pdf';
};

export const isDocFile = (fileName: string): boolean => {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
};

export const saveFilePermanently = async (tempPath: string): Promise<string> => {
  try {
    if (typeof Taro.saveFile === 'function') {
      const res = await Taro.saveFile({ tempFilePath: tempPath });
      console.info('[FileUtils]', '文件保存成功:', res.savedFilePath);
      return res.savedFilePath;
    }
    return tempPath;
  } catch (e) {
    console.error('[FileUtils]', '文件保存失败:', e);
    return tempPath;
  }
};

export const getAccessibleFilePath = (file: {
  filePath: string;
  permanentPath?: string;
  fileData?: string;
  fileName: string;
}): string => {
  if (file.permanentPath) return file.permanentPath;
  if (file.fileData) return file.fileData;
  return file.filePath;
};

export const previewImageFile = (
  currentUrl: string,
  allUrls: string[],
): void => {
  try {
    Taro.previewImage({
      current: currentUrl,
      urls: allUrls,
    });
  } catch (e) {
    console.error('[FileUtils]', '图片预览失败:', e);
    Taro.showToast({ title: '预览失败', icon: 'none' });
  }
};

export const openDocumentFile = async (
  filePath: string,
  fileType?: string,
): Promise<void> => {
  try {
    if (typeof Taro.openDocument === 'function') {
      const fileTypeMap: Record<string, string> = {
        pdf: 'pdf',
        doc: 'doc', docx: 'doc',
        xls: 'xls', xlsx: 'xls',
        ppt: 'ppt', pptx: 'ppt',
      };
      const type = fileType || '';
      const result = await Taro.openDocument({
        filePath,
        fileType: (fileTypeMap[type] || undefined) as any,
        showMenu: true,
      });
      console.info('[FileUtils]', '文档打开成功');
      return result;
    }
    Taro.showToast({ title: '当前环境不支持打开文档', icon: 'none' });
  } catch (e) {
    console.error('[FileUtils]', '文档打开失败:', e);
    Taro.showToast({ title: '打开失败，请在文件管理器查看', icon: 'none' });
  }
};

export const readFileAsBase64 = async (filePath: string): Promise<string | null> => {
  try {
    if (typeof Taro.getFileSystemManager === 'function') {
      const fs = Taro.getFileSystemManager();
      return new Promise((resolve) => {
        fs.readFile({
          filePath,
          encoding: 'base64',
          success: (res) => {
            resolve(res.data as string);
          },
          fail: () => {
            resolve(null);
          },
        });
      });
    }
    return null;
  } catch (e) {
    console.error('[FileUtils]', '读取文件失败:', e);
    return null;
  }
};
