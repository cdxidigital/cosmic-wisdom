CREATE TABLE `cosmicReadings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileId` int,
	`readingType` enum('tarot','palmistry') NOT NULL,
	`title` varchar(180) NOT NULL,
	`readingContext` varchar(80) NOT NULL,
	`narrative` text NOT NULL,
	`inputData` json,
	`consentVersion` varchar(32) NOT NULL,
	`cameraMediaStored` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cosmicReadings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cosmicReadings` ADD CONSTRAINT `cosmicReadings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cosmicReadings` ADD CONSTRAINT `cosmicReadings_profileId_cosmicProfiles_id_fk` FOREIGN KEY (`profileId`) REFERENCES `cosmicProfiles`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `cosmicReadings_userId_idx` ON `cosmicReadings` (`userId`);--> statement-breakpoint
CREATE INDEX `cosmicReadings_profileId_idx` ON `cosmicReadings` (`profileId`);