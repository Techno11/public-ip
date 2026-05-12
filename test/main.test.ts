import {
  afterAll,
  beforeEach,
  describe,
  expect,
  jest,
  test
} from "@jest/globals";

const mockGetJson = jest.fn();
const mockGetInput = jest.fn();
const mockSetOutput = jest.fn();
const mockInfo = jest.fn();
const mockSetFailed = jest.fn();

jest.unstable_mockModule("@actions/core", () => ({
  getInput: mockGetInput,
  setOutput: mockSetOutput,
  info: mockInfo,
  setFailed: mockSetFailed
}));

jest.unstable_mockModule("@actions/http-client", () => ({
  HttpClient: class HttpClient {
    constructor(
      _userAgent?: string,
      _handlers?: unknown,
      _socketTimeout?: unknown
    ) {}
    getJson = mockGetJson;
  }
}));

describe("Public IP", () => {
  let run: () => Promise<void>;

  beforeEach(async () => {
    jest.resetModules();
    mockGetJson.mockReset();
    mockGetInput.mockReset();
    mockSetOutput.mockReset();
    mockInfo.mockReset();
    mockSetFailed.mockReset();
    mockGetInput.mockReturnValue("6");
    const main = await import("../src/main.js");
    run = main.run;
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test("Return public ip address", async () => {
    mockGetJson.mockResolvedValue({
      statusCode: 200,
      result: { ip: "1.2.3.4" }
    });

    await expect(run()).resolves.toBe(undefined);

    expect(mockGetJson).toHaveBeenCalled();
    expect(mockGetInput).toHaveBeenCalledWith("maxRetries");
    expect(mockGetInput).toHaveReturnedWith("6");
    expect(mockSetOutput).toHaveBeenCalledTimes(2);
    expect(mockSetOutput).toHaveBeenCalledWith("ipv4", "1.2.3.4");
    expect(mockSetOutput).toHaveBeenCalledWith("ipv6", "1.2.3.4");
  });

  test("Fail when ipify does not respond", async () => {
    mockGetJson.mockRejectedValue({
      statusCode: 500,
      result: null
    });

    await expect(run()).resolves.toBe(undefined);

    expect(mockGetJson).toHaveBeenCalled();
    expect(mockSetFailed).toHaveBeenCalled();
  });
});
