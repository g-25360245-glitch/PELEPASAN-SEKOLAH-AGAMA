export interface Student {
  id: string;
  name: string;
  class: string;
}

export interface LetterData {
  rujukan: string;
  tarikh: string;
  namaSekAgama: string;
  namaProgram: string;
  tarikhProgram: string;
  hariProgram: string;
  students: Student[];
}

export enum AppStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  UPLOADING = 'UPLOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}