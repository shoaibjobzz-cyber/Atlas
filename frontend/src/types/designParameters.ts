export type LinkedRequirementReference = {
  id: string;
  title: string;
  type: string;
  status: string;
};

export type DesignParameter = {
  id: string;
  project_id: string;
  name: string;
  subsystem: string | null;
  parameter_name: string;
  value: string;
  unit: string | null;
  source_document: string | null;
  revision: string | null;
  notes: string | null;
  linked_requirements: LinkedRequirementReference[];
};

export type LinkedDesignParameterReference = {
  id: string;
  name: string;
  subsystem: string | null;
  parameter_name: string;
  value: string;
  unit: string | null;
  source_document: string | null;
  revision: string | null;
};

export type DesignParameterFormValues = {
  id: string;
  project_id: string;
  name: string;
  subsystem: string | null;
  parameter_name: string;
  value: string;
  unit: string | null;
  source_document: string | null;
  revision: string | null;
  notes: string | null;
  requirement_ids: string[];
};

export type DesignParameterFormErrors = Partial<Record<keyof DesignParameterFormValues, string>>;
