/* ============================================================
   DigitalVotingDB_TablesReset.sql
   - Creates DigitalVotingDB (if not exists)
   - Drops & recreates all tables
   - Schema matches current Node/React code
   ============================================================ */

---------------------------------------------------------------
-- Create DB if needed & switch context
---------------------------------------------------------------
IF DB_ID('DigitalVotingDB') IS NULL
BEGIN
    CREATE DATABASE DigitalVotingDB;
END
GO

USE DigitalVotingDB;
GO

---------------------------------------------------------------
-- Drop existing tables in FK-safe order
---------------------------------------------------------------
IF OBJECT_ID('dbo.Votes', 'U') IS NOT NULL DROP TABLE dbo.Votes;
IF OBJECT_ID('dbo.Feedback', 'U') IS NOT NULL DROP TABLE dbo.Feedback;
IF OBJECT_ID('dbo.OtpCodes', 'U') IS NOT NULL DROP TABLE dbo.OtpCodes;
IF OBJECT_ID('dbo.Candidates', 'U') IS NOT NULL DROP TABLE dbo.Candidates;
IF OBJECT_ID('dbo.Voters', 'U') IS NOT NULL DROP TABLE dbo.Voters;
GO

---------------------------------------------------------------
-- VOTERS
-- Used for login, roles, and tying votes/feedback to a person.
---------------------------------------------------------------
CREATE TABLE dbo.Voters
(
    VoterId      INT IDENTITY(1,1)       NOT NULL PRIMARY KEY,
    FullName     NVARCHAR(400)           NOT NULL,
    Email        NVARCHAR(400)           NOT NULL UNIQUE,
    Phone        NVARCHAR(100)           NULL,
    Gender       NVARCHAR(100)           NULL,
    StudentId    NVARCHAR(200)           NULL,

    PasswordHash NVARCHAR(255)           NOT NULL,  -- bcrypt from backend
    Role         NVARCHAR(20)            NOT NULL 
                  CONSTRAINT DF_Voters_Role DEFAULT ('voter'),

    IsVerified   BIT                     NOT NULL 
                  CONSTRAINT DF_Voters_IsVerified DEFAULT (1),

    CreatedAt    DATETIME2(7)            NOT NULL 
                  CONSTRAINT DF_Voters_CreatedAt DEFAULT (SYSDATETIME())
);
GO

---------------------------------------------------------------
-- CANDIDATES
-- Used for listing candidates & positions.
---------------------------------------------------------------
CREATE TABLE dbo.Candidates
(
    CandidateId  INT IDENTITY(1,1)       NOT NULL PRIMARY KEY,
    Name         NVARCHAR(200)           NOT NULL,
    Position     NVARCHAR(100)           NOT NULL,  -- president, vice_president, etc.
    Gender       NVARCHAR(20)            NULL,      -- male/female (for avatar)
    Manifesto    NVARCHAR(1000)          NULL,
    PhotoUrl     NVARCHAR(500)           NULL,

    IsActive     BIT                     NOT NULL 
                  CONSTRAINT DF_Candidates_IsActive DEFAULT (1),

    CreatedAt    DATETIME2(7)            NOT NULL 
                  CONSTRAINT DF_Candidates_CreatedAt DEFAULT (SYSDATETIME())
);
GO

---------------------------------------------------------------
-- VOTES
-- One vote per voter per position.
---------------------------------------------------------------
CREATE TABLE dbo.Votes
(
    VoteId       INT IDENTITY(1,1)       NOT NULL PRIMARY KEY,
    VoterId      INT                     NOT NULL,
    CandidateId  INT                     NOT NULL,
    Position     NVARCHAR(100)           NOT NULL,  -- copied from candidate at cast time

    CastAt       DATETIME2(7)            NOT NULL 
                  CONSTRAINT DF_Votes_CastAt DEFAULT (SYSDATETIME()),

    CONSTRAINT FK_Votes_Voters
        FOREIGN KEY (VoterId) REFERENCES dbo.Voters (VoterId),

    CONSTRAINT FK_Votes_Candidates
        FOREIGN KEY (CandidateId) REFERENCES dbo.Candidates (CandidateId),

    -- prevent multiple votes for same position by same voter
    CONSTRAINT UQ_Votes_Voter_Position UNIQUE (VoterId, Position)
);
GO

---------------------------------------------------------------
-- FEEDBACK
---------------------------------------------------------------
CREATE TABLE dbo.Feedback
(
    FeedbackId   INT IDENTITY(1,1)       NOT NULL PRIMARY KEY,
    VoterId      INT                     NULL,
    Message      NVARCHAR(1000)          NOT NULL,
    Rating       INT                     NULL,

    CreatedAt    DATETIME2(7)            NOT NULL 
                  CONSTRAINT DF_Feedback_CreatedAt DEFAULT (SYSDATETIME()),

    CONSTRAINT FK_Feedback_Voters
        FOREIGN KEY (VoterId) REFERENCES dbo.Voters (VoterId)
);
GO

---------------------------------------------------------------
-- OTP CODES
-- Currently not used heavily (you use 123456 in UI),
-- but these tables + procs let you move to real OTP later.
---------------------------------------------------------------
CREATE TABLE dbo.OtpCodes
(
    OtpId        INT IDENTITY(1,1)       NOT NULL PRIMARY KEY,
    VoterId      INT                     NULL,
    Code         NVARCHAR(10)            NOT NULL,
    ExpiresAt    DATETIME2(7)            NOT NULL,
    IsUsed       BIT                     NOT NULL 
                  CONSTRAINT DF_OtpCodes_IsUsed DEFAULT (0),
    CreatedAt    DATETIME2(7)            NOT NULL 
                  CONSTRAINT DF_OtpCodes_CreatedAt DEFAULT (SYSDATETIME()),

    CONSTRAINT FK_OtpCodes_Voters
        FOREIGN KEY (VoterId) REFERENCES dbo.Voters (VoterId)
);
GO

---------------------------------------------------------------
-- OPTIONAL SEED DATA (uncomment if you want starting data)
---------------------------------------------------------------
/*
-- Example candidates
INSERT INTO dbo.Candidates (Name, Position, Gender, Manifesto, PhotoUrl)
VALUES
('Alice Johnson', 'president', 'female', 'I will improve campus services.', NULL),
('Brian Thomas', 'vice_president', 'male', 'I will support the president and students.', NULL),
('Chitra Singh', 'secretary', 'female', 'I will make communication transparent.', NULL),
('David Lee', 'sports_secretary', 'male', 'I will upgrade sports facilities.', NULL),
('Farhan Khan', 'treasurer', 'male', 'I will handle funds responsibly.', NULL);
*/
GO
