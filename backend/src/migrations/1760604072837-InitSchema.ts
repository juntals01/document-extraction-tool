import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1760604072837 implements MigrationInterface {
    name = 'InitSchema1760604072837'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "uploads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "originalName" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "storedName" character varying(255) NOT NULL, "path" text NOT NULL, "size" bigint NOT NULL, "mimetype" character varying(128) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_81837d345699461c57cf96aa796" UNIQUE ("slug"), CONSTRAINT "PK_d1781d1eedd7459314f60f39bd3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "processed_pdfs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uploadId" character varying(128) NOT NULL, "pageNumber" integer NOT NULL, "pagePdfPath" text, "extractedText" text, "extractedHtml" text, "structuredJson" jsonb, "structuredRaw" text, "status" character varying(16) NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_75bd0a8125a0a2d861f5860acab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fd7523c0b124a63437c259dc56" ON "processed_pdfs" ("uploadId", "pageNumber") `);
        await queryRunner.query(`CREATE TABLE "processed_pdf_tables" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "processedPdfId" uuid NOT NULL, "index" integer NOT NULL, "tablePath" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a6424fd675efeb1d3405f91723f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e41442cfdb46accc8d3ef2ef7b" ON "processed_pdf_tables" ("processedPdfId") `);
        await queryRunner.query(`CREATE TABLE "processed_pdf_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "processedPdfId" uuid NOT NULL, "index" integer NOT NULL, "imagePath" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9f68e7e5c6416c169a822e6a7d0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_809a6b31099328c3c333f7e501" ON "processed_pdf_images" ("processedPdfId") `);
        await queryRunner.query(`CREATE TABLE "outreach_activities" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "upload_id" uuid NOT NULL, "audience" character varying(255), "channel" character varying(255), "message" text, "kpi" jsonb, "progress" jsonb, "schedule" jsonb NOT NULL DEFAULT '{"start":null,"end":null}', "responsibleParty" character varying(255), "evidence" jsonb NOT NULL DEFAULT '[]', CONSTRAINT "PK_28d342ddcd4513d7c7a457882b4" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b578ece7703e8e687e1a43a8c6" ON "outreach_activities" ("upload_id") `);
        await queryRunner.query(`CREATE TABLE "monitoring_metrics" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "upload_id" uuid NOT NULL, "parameter" character varying(255) NOT NULL, "method" character varying(255), "frequency" character varying(255), "threshold" jsonb, "progress" jsonb, "location" character varying(255), "responsibleParty" character varying(255), "evidence" jsonb NOT NULL DEFAULT '[]', CONSTRAINT "PK_653895a482f58d7ee1593cffb47" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7bbb1a15d8daea432506cb78ab" ON "monitoring_metrics" ("upload_id") `);
        await queryRunner.query(`CREATE TABLE "implementation_activities" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "upload_id" uuid NOT NULL, "action" text NOT NULL, "actor" character varying(255), "start" character varying(32), "end" character varying(32), "budget" jsonb, "status" character varying(32), "progress" jsonb, "dependencies" jsonb NOT NULL DEFAULT '[]', "location" character varying(255), "evidence" jsonb NOT NULL DEFAULT '[]', CONSTRAINT "PK_12bd863aa0aa204cce6289b26f6" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE INDEX "IDX_cdcffd3265f8a7c80e0ecf140a" ON "implementation_activities" ("upload_id") `);
        await queryRunner.query(`CREATE TABLE "goals" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "upload_id" uuid NOT NULL, "title" character varying(512), "description" text NOT NULL, "pollutant" character varying(64), "target" jsonb, "progress" jsonb, "deadline" character varying(16), "location" character varying(255), "evidence" jsonb NOT NULL DEFAULT '[]', CONSTRAINT "PK_0b9e985bca446e851a802432bef" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fc7d1286cae1f115593d0d5f1a" ON "goals" ("upload_id") `);
        await queryRunner.query(`CREATE TABLE "geographic_areas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "upload_id" uuid NOT NULL, "processed_image_ids" uuid array, "name" character varying(255), "huc" character varying(128), "coordinates" jsonb, "description" text, "evidence" jsonb NOT NULL DEFAULT '[]', CONSTRAINT "uq_geoarea_upload_name" UNIQUE ("upload_id", "name"), CONSTRAINT "PK_900fd6c11a82e00b173c20c0560" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_geoarea_upload_id" ON "geographic_areas" ("upload_id") `);
        await queryRunner.query(`CREATE TABLE "bmps" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "upload_id" uuid NOT NULL, "name" character varying(255), "type" character varying(255), "quantity" jsonb, "cost" jsonb, "progress" jsonb, "location" character varying(255), "responsibleParty" character varying(255), "schedule" jsonb NOT NULL DEFAULT '{"start":null,"end":null}', "relatedGoals" jsonb NOT NULL DEFAULT '[]', "evidence" jsonb NOT NULL DEFAULT '[]', CONSTRAINT "PK_0c3aa5335a5b31e61651986ca47" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0105c167b48695aa7c21b3adc4" ON "bmps" ("upload_id") `);
        await queryRunner.query(`ALTER TABLE "processed_pdf_tables" ADD CONSTRAINT "FK_e41442cfdb46accc8d3ef2ef7b9" FOREIGN KEY ("processedPdfId") REFERENCES "processed_pdfs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "processed_pdf_images" ADD CONSTRAINT "FK_809a6b31099328c3c333f7e501f" FOREIGN KEY ("processedPdfId") REFERENCES "processed_pdfs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "outreach_activities" ADD CONSTRAINT "FK_b578ece7703e8e687e1a43a8c6c" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "monitoring_metrics" ADD CONSTRAINT "FK_7bbb1a15d8daea432506cb78ab2" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "implementation_activities" ADD CONSTRAINT "FK_cdcffd3265f8a7c80e0ecf140ae" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "goals" ADD CONSTRAINT "FK_fc7d1286cae1f115593d0d5f1a9" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "geographic_areas" ADD CONSTRAINT "FK_d6a6379894d145f2c7787aa87fc" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bmps" ADD CONSTRAINT "FK_0105c167b48695aa7c21b3adc44" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bmps" DROP CONSTRAINT "FK_0105c167b48695aa7c21b3adc44"`);
        await queryRunner.query(`ALTER TABLE "geographic_areas" DROP CONSTRAINT "FK_d6a6379894d145f2c7787aa87fc"`);
        await queryRunner.query(`ALTER TABLE "goals" DROP CONSTRAINT "FK_fc7d1286cae1f115593d0d5f1a9"`);
        await queryRunner.query(`ALTER TABLE "implementation_activities" DROP CONSTRAINT "FK_cdcffd3265f8a7c80e0ecf140ae"`);
        await queryRunner.query(`ALTER TABLE "monitoring_metrics" DROP CONSTRAINT "FK_7bbb1a15d8daea432506cb78ab2"`);
        await queryRunner.query(`ALTER TABLE "outreach_activities" DROP CONSTRAINT "FK_b578ece7703e8e687e1a43a8c6c"`);
        await queryRunner.query(`ALTER TABLE "processed_pdf_images" DROP CONSTRAINT "FK_809a6b31099328c3c333f7e501f"`);
        await queryRunner.query(`ALTER TABLE "processed_pdf_tables" DROP CONSTRAINT "FK_e41442cfdb46accc8d3ef2ef7b9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0105c167b48695aa7c21b3adc4"`);
        await queryRunner.query(`DROP TABLE "bmps"`);
        await queryRunner.query(`DROP INDEX "public"."idx_geoarea_upload_id"`);
        await queryRunner.query(`DROP TABLE "geographic_areas"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fc7d1286cae1f115593d0d5f1a"`);
        await queryRunner.query(`DROP TABLE "goals"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cdcffd3265f8a7c80e0ecf140a"`);
        await queryRunner.query(`DROP TABLE "implementation_activities"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7bbb1a15d8daea432506cb78ab"`);
        await queryRunner.query(`DROP TABLE "monitoring_metrics"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b578ece7703e8e687e1a43a8c6"`);
        await queryRunner.query(`DROP TABLE "outreach_activities"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_809a6b31099328c3c333f7e501"`);
        await queryRunner.query(`DROP TABLE "processed_pdf_images"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e41442cfdb46accc8d3ef2ef7b"`);
        await queryRunner.query(`DROP TABLE "processed_pdf_tables"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fd7523c0b124a63437c259dc56"`);
        await queryRunner.query(`DROP TABLE "processed_pdfs"`);
        await queryRunner.query(`DROP TABLE "uploads"`);
    }

}
