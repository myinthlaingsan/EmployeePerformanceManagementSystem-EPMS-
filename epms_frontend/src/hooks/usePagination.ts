import { useSearchParams } from 'react-router-dom';

interface PaginationState {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

/**
 * Custom hook to manage pagination state via URL query parameters.
 * Supports multiple independent instances per page by providing a unique prefix.
 */
export const usePagination = (prefix: string = '', defaultSize: number = 10): PaginationState => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const pageKey = prefix ? `${prefix}Page` : 'page';
  const sizeKey = prefix ? `${prefix}Size` : 'pageSize';

  const page = parseInt(searchParams.get(pageKey) || '1', 10);
  const pageSize = parseInt(searchParams.get(sizeKey) || defaultSize.toString(), 10);

  const setPage = (newPage: number) => {
    const nextParams = new URLSearchParams(searchParams);
    if (newPage === 1) {
      nextParams.delete(pageKey);
    } else {
      nextParams.set(pageKey, newPage.toString());
    }
    setSearchParams(nextParams);
  };

  const setPageSize = (newSize: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set(sizeKey, newSize.toString());
    nextParams.delete(pageKey); // Reset to page 1 on size change
    setSearchParams(nextParams);
  };

  return {
    page,
    pageSize,
    setPage,
    setPageSize
  };
};
