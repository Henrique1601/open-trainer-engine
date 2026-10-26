import koffi from 'koffi';

// Carrega as bibliotecas do Windows
export const kernel32 = koffi.load('kernel32.dll');
export const user32 = koffi.load('user32.dll');

// ==============================================================================
// Constantes de Processo e Memória
// ==============================================================================
export const PROCESS_TERMINATE = 0x0001;
export const PROCESS_CREATE_THREAD = 0x0002;
export const PROCESS_VM_OPERATION = 0x0008;
export const PROCESS_VM_READ = 0x0010;
export const PROCESS_VM_WRITE = 0x0020;
export const PROCESS_DUP_HANDLE = 0x0040;
export const PROCESS_CREATE_PROCESS = 0x0080;
export const PROCESS_SET_QUOTA = 0x0100;
export const PROCESS_SET_INFORMATION = 0x0200;
export const PROCESS_QUERY_INFORMATION = 0x0400;
export const PROCESS_SUSPEND_RESUME = 0x0800;
export const PROCESS_QUERY_LIMITED_INFORMATION = 0x1000;
export const SYNCHRONIZE = 0x00100000;
export const PROCESS_ALL_ACCESS = 0x1F0FFF;

export const MEM_COMMIT = 0x1000;
export const MEM_RESERVE = 0x2000;
export const MEM_RELEASE = 0x8000;

export const PAGE_NOACCESS = 0x01;
export const PAGE_READONLY = 0x02;
export const PAGE_READWRITE = 0x04;
export const PAGE_WRITECOPY = 0x08;
export const PAGE_EXECUTE = 0x10;
export const PAGE_EXECUTE_READ = 0x20;
export const PAGE_EXECUTE_READWRITE = 0x40;
export const PAGE_EXECUTE_WRITECOPY = 0x80;
export const PAGE_GUARD = 0x100;

export const TH32CS_SNAPPROCESS = 0x00000002;
export const TH32CS_SNAPMODULE = 0x00000008;
export const TH32CS_SNAPMODULE32 = 0x00000010;

export const INVALID_HANDLE_VALUE = -1;

// ==============================================================================
// Estruturas Win32
// ==============================================================================
export const PROCESSENTRY32W = koffi.struct('PROCESSENTRY32W', {
  dwSize: 'uint32',
  cntUsage: 'uint32',
  th32ProcessID: 'uint32',
  th32DefaultHeapID: 'uintptr',
  th32ModuleID: 'uint32',
  cntThreads: 'uint32',
  th32ParentProcessID: 'uint32',
  pcPriClassBase: 'int32',
  dwFlags: 'uint32',
  szExeFile: koffi.array('char16_t', 260)
});

export const MODULEENTRY32W = koffi.struct('MODULEENTRY32W', {
  dwSize: 'uint32',
  th32ModuleID: 'uint32',
  th32ProcessID: 'uint32',
  GlblcntUsage: 'uint32',
  ProccntUsage: 'uint32',
  modBaseAddr: 'uintptr',
  modBaseSize: 'uint32',
  hModule: 'uintptr',
  szModule: koffi.array('char16_t', 256),
  szExePath: koffi.array('char16_t', 260)
});

export const MEMORY_BASIC_INFORMATION = koffi.struct('MEMORY_BASIC_INFORMATION', {
  BaseAddress: 'uintptr',
  AllocationBase: 'uintptr',
  AllocationProtect: 'uint32',
  PartitionId: 'uint16',
  RegionSize: 'size_t',
  State: 'uint32',
  Protect: 'uint32',
  Type: 'uint32'
});

// ==============================================================================
// Funções da API do Windows (kernel32 & user32)
// ==============================================================================
export const OpenProcess = kernel32.func('uintptr __stdcall OpenProcess(uint32 dwDesiredAccess, int32 bInheritHandle, uint32 dwProcessId)');
export const CloseHandle = kernel32.func('int32 __stdcall CloseHandle(uintptr hObject)');
export const GetCurrentProcess = kernel32.func('uintptr __stdcall GetCurrentProcess()');
export const GetCurrentProcessId = kernel32.func('uint32 __stdcall GetCurrentProcessId()');

export const ReadProcessMemory = kernel32.func('int32 __stdcall ReadProcessMemory(uintptr hProcess, uintptr lpBaseAddress, _Out_ uint8_t *lpBuffer, size_t nSize, _Out_ size_t *lpNumberOfBytesRead)');
export const WriteProcessMemory = kernel32.func('int32 __stdcall WriteProcessMemory(uintptr hProcess, uintptr lpBaseAddress, const uint8_t *lpBuffer, size_t nSize, _Out_ size_t *lpNumberOfBytesWritten)');

export const VirtualAllocEx = kernel32.func('uintptr __stdcall VirtualAllocEx(uintptr hProcess, uintptr lpAddress, size_t dwSize, uint32 flAllocationType, uint32 flProtect)');
export const VirtualFreeEx = kernel32.func('int32 __stdcall VirtualFreeEx(uintptr hProcess, uintptr lpAddress, size_t dwSize, uint32 dwFreeType)');
export const VirtualProtectEx = kernel32.func('int32 __stdcall VirtualProtectEx(uintptr hProcess, uintptr lpBaseAddress, size_t dwSize, uint32 flNewProtect, _Out_ uint32 *lpflOldProtect)');
export const VirtualQueryEx = kernel32.func('size_t __stdcall VirtualQueryEx(uintptr hProcess, uintptr lpAddress, _Out_ MEMORY_BASIC_INFORMATION *lpBuffer, size_t dwLength)');

export const CreateToolhelp32Snapshot = kernel32.func('uintptr __stdcall CreateToolhelp32Snapshot(uint32 dwFlags, uint32 th32ProcessID)');
export const Process32FirstW = kernel32.func('int32 __stdcall Process32FirstW(uintptr hSnapshot, _Inout_ PROCESSENTRY32W *lppe)');
export const Process32NextW = kernel32.func('int32 __stdcall Process32NextW(uintptr hSnapshot, _Inout_ PROCESSENTRY32W *lppe)');
export const Module32FirstW = kernel32.func('int32 __stdcall Module32FirstW(uintptr hSnapshot, _Inout_ MODULEENTRY32W *lpme)');
export const Module32NextW = kernel32.func('int32 __stdcall Module32NextW(uintptr hSnapshot, _Inout_ MODULEENTRY32W *lpme)');

export const RegisterHotKey = user32.func('int32 __stdcall RegisterHotKey(uintptr hWnd, int32 id, uint32 fsModifiers, uint32 vk)');
export const UnregisterHotKey = user32.func('int32 __stdcall UnregisterHotKey(uintptr hWnd, int32 id)');
