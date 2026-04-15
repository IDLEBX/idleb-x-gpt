// src/constants.ts
interface IConstants {
  statusBroadcast: string;
  sessionPath: string;
}

const constants: IConstants = {
  statusBroadcast: "status@broadcast",
  sessionPath: "./session" // مسار حفظ جلسة الواتساب
};

export default constants;
