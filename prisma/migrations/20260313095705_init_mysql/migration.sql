-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Post` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NULL,
    `url` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `published` BOOLEAN NOT NULL DEFAULT false,
    `authorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Post_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LinkAnalysis` (
    `id` VARCHAR(191) NOT NULL,
    `postId` VARCHAR(191) NOT NULL,
    `pageTitle` VARCHAR(191) NOT NULL,
    `pageSummary` VARCHAR(191) NOT NULL,
    `orphanRisk` VARCHAR(191) NOT NULL,
    `totalOpportunities` INTEGER NOT NULL,
    `opportunities` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `LinkAnalysis_postId_key`(`postId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AutoHyperlink` (
    `id` VARCHAR(191) NOT NULL,
    `postId` VARCHAR(191) NOT NULL,
    `originalWordCount` INTEGER NOT NULL,
    `linksInjected` INTEGER NOT NULL,
    `linkDensity` DOUBLE NOT NULL,
    `processedHtml` VARCHAR(191) NOT NULL,
    `linkMap` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KMReport` (
    `id` VARCHAR(191) NOT NULL,
    `postId` VARCHAR(191) NOT NULL,
    `siteUrl` VARCHAR(191) NOT NULL,
    `overallKMScore` INTEGER NOT NULL,
    `metrics` VARCHAR(191) NOT NULL,
    `knowledgeGaps` VARCHAR(191) NOT NULL,
    `topTopics` VARCHAR(191) NOT NULL,
    `recommendations` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `KMReport_postId_key`(`postId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentLog` (
    `id` VARCHAR(191) NOT NULL,
    `agentType` VARCHAR(191) NOT NULL,
    `postId` VARCHAR(191) NULL,
    `input` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `duration` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CmsConnection` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('wordpress', 'drupal', 'joomla') NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `apiKey` VARCHAR(191) NOT NULL,
    `status` ENUM('connected', 'disconnected', 'error') NOT NULL DEFAULT 'connected',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CmsConnection_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CmsContentItem` (
    `id` VARCHAR(191) NOT NULL,
    `cmsId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` LONGTEXT NOT NULL,
    `author` VARCHAR(191) NOT NULL,
    `status` ENUM('published', 'draft', 'pending') NOT NULL DEFAULT 'draft',
    `date` DATETIME(3) NOT NULL,
    `tags` JSON NOT NULL,
    `wordCount` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CmsContentItem_cmsId_idx`(`cmsId`),
    INDEX `CmsContentItem_status_idx`(`status`),
    INDEX `CmsContentItem_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Assignment` (
    `id` VARCHAR(191) NOT NULL,
    `contentId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NOT NULL,
    `priority` ENUM('high', 'medium', 'low') NOT NULL,
    `suggestedAction` LONGTEXT NOT NULL,
    `status` ENUM('pending', 'accepted', 'dismissed') NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Assignment_contentId_idx`(`contentId`),
    INDEX `Assignment_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiAgentReport` (
    `id` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `agentName` VARCHAR(191) NOT NULL,
    `connectionId` VARCHAR(191) NOT NULL,
    `contentId` VARCHAR(191) NOT NULL,
    `contentTitle` VARCHAR(191) NOT NULL,
    `result` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AiAgentReport_agentId_idx`(`agentId`),
    INDEX `AiAgentReport_connectionId_idx`(`connectionId`),
    INDEX `AiAgentReport_contentId_idx`(`contentId`),
    INDEX `AiAgentReport_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LinkAnalysis` ADD CONSTRAINT `LinkAnalysis_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutoHyperlink` ADD CONSTRAINT `AutoHyperlink_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KMReport` ADD CONSTRAINT `KMReport_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CmsContentItem` ADD CONSTRAINT `CmsContentItem_cmsId_fkey` FOREIGN KEY (`cmsId`) REFERENCES `CmsConnection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assignment` ADD CONSTRAINT `Assignment_contentId_fkey` FOREIGN KEY (`contentId`) REFERENCES `CmsContentItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiAgentReport` ADD CONSTRAINT `AiAgentReport_connectionId_fkey` FOREIGN KEY (`connectionId`) REFERENCES `CmsConnection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiAgentReport` ADD CONSTRAINT `AiAgentReport_contentId_fkey` FOREIGN KEY (`contentId`) REFERENCES `CmsContentItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
