export class CreateUploadDto {
  originalName!: string;
  slug!: string;
  storedName!: string;
  path!: string;
  size!: number;
  mimetype!: string;
}
