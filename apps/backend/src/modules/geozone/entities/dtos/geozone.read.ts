import { GeozoneType } from '../geozone.type';
import { GeozoneVersionRead } from './geozone-version.read';

export class GeozoneRead {
  id: string;
  name: string;
  type: GeozoneType;
  color: string;
  currentVersionId: string | null;
  createdAt: Date;
  deletedAt: Date | null;
  createdByUserId: string;
  /** Опционально подгружается вместе с зоной. */
  currentVersion?: GeozoneVersionRead;
}
