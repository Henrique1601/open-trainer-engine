export enum TrainerLaunchState {
  Idle = 'Idle',
  AcquiringBinary = 'AcquiringBinary',
  EnsuringBinaryAccess = 'EnsuringBinaryAccess',
  CheckingInternalBinaries = 'CheckingInternalBinaries',
  FindingProcess = 'FindingProcess',
  ValidatingProcess = 'ValidatingProcess',
  CreatingTrainerHost = 'CreatingTrainerHost',
  Injecting = 'Injecting',
  InitializingIpc = 'InitializingIpc',
  Executing = 'Executing',
  Connecting = 'Connecting',
  Activating = 'Activating',
  Active = 'Active',
  Detaching = 'Detaching',
  Ended = 'Ended'
}

export type CheatType = 'aob_patch' | 'pointer_freeze' | 'speedhack' | 'lua_script';

export type ValueType = 'int8' | 'int16' | 'int32' | 'int64' | 'float' | 'double' | 'byte';

export interface CheatDefinition {
  id: string;
  name: string;
  category: string;
  type: CheatType;
  hotkey?: string;

  // Parâmetros para AOB Patch
  pattern?: string;
  replace?: string;

  // Parâmetros para Pointer Freeze
  baseModule?: string;
  pointerChain?: (string | number)[];
  valueType?: ValueType;
  value?: number | boolean | string;

  // Parâmetros para Script Lua
  scriptPath?: string;
}

export interface TrainerContract {
  id: string;
  title: string;
  processName: string;
  version: string;
  supportedPlatforms?: string[];
  cheats: CheatDefinition[];
}
