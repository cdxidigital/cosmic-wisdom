CREATE TABLE `cosmicDailyBriefs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`briefDate` varchar(10) NOT NULL,
	`narrative` text NOT NULL,
	`sourceSummary` json,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cosmicDailyBriefs_id` PRIMARY KEY(`id`),
	CONSTRAINT `cosmicDailyBriefs_profileId_briefDate_unique` UNIQUE(`profileId`,`briefDate`)
);
--> statement-breakpoint
CREATE TABLE `cosmicFiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileId` int,
	`fileKind` enum('report','profile_asset','attachment') NOT NULL,
	`storageKey` varchar(768) NOT NULL,
	`storageUrl` varchar(1024) NOT NULL,
	`originalFilename` varchar(512) NOT NULL,
	`mimeType` varchar(160) NOT NULL,
	`byteSize` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cosmicFiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `cosmicFiles_storageKey_unique` UNIQUE(`storageKey`)
);
--> statement-breakpoint
CREATE TABLE `cosmicPatternSignals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`sourceSystem` enum('astrology','numerology','human_design') NOT NULL,
	`signalKey` varchar(120) NOT NULL,
	`label` varchar(200) NOT NULL,
	`detail` text,
	`signalData` json,
	`observedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cosmicPatternSignals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cosmicProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(120) NOT NULL,
	`birthDate` varchar(10) NOT NULL,
	`birthTime` varchar(5),
	`birthLocation` varchar(512) NOT NULL,
	`timezone` varchar(64) NOT NULL,
	`calculationStatus` enum('pending','ready','stale','failed') NOT NULL DEFAULT 'pending',
	`calculationVersion` varchar(40),
	`calculationData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cosmicProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `cosmicProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `cosmicDailyBriefs` ADD CONSTRAINT `cosmicDailyBriefs_profileId_cosmicProfiles_id_fk` FOREIGN KEY (`profileId`) REFERENCES `cosmicProfiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cosmicFiles` ADD CONSTRAINT `cosmicFiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cosmicFiles` ADD CONSTRAINT `cosmicFiles_profileId_cosmicProfiles_id_fk` FOREIGN KEY (`profileId`) REFERENCES `cosmicProfiles`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cosmicPatternSignals` ADD CONSTRAINT `cosmicPatternSignals_profileId_cosmicProfiles_id_fk` FOREIGN KEY (`profileId`) REFERENCES `cosmicProfiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cosmicProfiles` ADD CONSTRAINT `cosmicProfiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `cosmicDailyBriefs_profileId_idx` ON `cosmicDailyBriefs` (`profileId`);--> statement-breakpoint
CREATE INDEX `cosmicFiles_userId_idx` ON `cosmicFiles` (`userId`);--> statement-breakpoint
CREATE INDEX `cosmicFiles_profileId_idx` ON `cosmicFiles` (`profileId`);--> statement-breakpoint
CREATE INDEX `cosmicPatternSignals_profileId_idx` ON `cosmicPatternSignals` (`profileId`);