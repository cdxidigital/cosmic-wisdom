CREATE TABLE `cosmicSavedItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contentKey` varchar(120) NOT NULL,
	`contentType` enum('natal','numerology','tarot','palmistry','compatibility','daily_quote') NOT NULL,
	`title` varchar(180) NOT NULL,
	`summary` varchar(500) NOT NULL,
	`href` varchar(256) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cosmicSavedItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `cosmicSavedItems_userId_contentKey_unique` UNIQUE(`userId`,`contentKey`)
);
--> statement-breakpoint
ALTER TABLE `cosmicSavedItems` ADD CONSTRAINT `cosmicSavedItems_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `cosmicSavedItems_userId_idx` ON `cosmicSavedItems` (`userId`);