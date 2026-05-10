import { requestJson } from "./httpClient";

export type DemoProjectLoadResponse = {
  project_id: string;
  project_name: string;
  requirements_loaded: number;
  design_parameters_loaded: number;
};

export function loadBrakingDemoProject(): Promise<DemoProjectLoadResponse> {
  return requestJson<DemoProjectLoadResponse>("/demo/load-braking-project", {
    method: "POST",
  });
}

export function loadBrakePlatformDemoProject(): Promise<DemoProjectLoadResponse> {
  return requestJson<DemoProjectLoadResponse>("/demo/load-brake-platform-project", {
    method: "POST",
  });
}
