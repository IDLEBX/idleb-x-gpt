// src/constants.ts
interface IConstants {
  statusBroadcast: string;
  sessionPath: string;
}

const constants: IConstants = {
  statusBroadcast: "status@broadcast",
  sessionPath: "./session"
};

export default constants;
