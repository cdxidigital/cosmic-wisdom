CREATE TABLE `cosmicNatalCharts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileId` int NOT NULL,
	`provider` varchar(80) NOT NULL,
	`providerVersion` varchar(80) NOT NULL,
	`calculationStatus` enum('ready','failed') NOT NULL DEFAULT 'ready',
	`chartData` json NOT NULL,
	`readingData` json NOT NULL,
	`sourceData` json NOT NULL,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cosmicNatalCharts_id` PRIMARY KEY(`id`),
	CONSTRAINT `cosmicNatalCharts_profileId_unique` UNIQUE(`profileId`)
);
--> statement-breakpoint
ALTER TABLE `cosmicNatalCharts` ADD CONSTRAINT `cosmicNatalCharts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cosmicNatalCharts` ADD CONSTRAINT `cosmicNatalCharts_profileId_cosmicProfiles_id_fk` FOREIGN KEY (`profileId`) REFERENCES `cosmicProfiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `cosmicNatalCharts_userId_idx` ON `cosmicNatalCharts` (`userId`);