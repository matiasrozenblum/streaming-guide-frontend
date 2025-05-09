export interface Schedule {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subscribed: boolean;
  program: {
    id: number;
    name: string;
    logo_url: string | null;
    description: string | null;
    stream_url: string | null;
    is_live: boolean;
    panelists: { id: string; name: string }[];
    channel: {
      id: number;
      name: string;
      logo_url: string | null;
    };
  };
}
