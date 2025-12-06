/* ============================================================
   DigitalVotingDB_Procedures.sql
   - Candidate CRUD
   - Vote casting & results
   - Feedback
   - OTP helpers (optional)
   ============================================================ */

USE DigitalVotingDB;
GO

---------------------------------------------------------------
-- Clean up old procedures (if exist)
---------------------------------------------------------------
IF OBJECT_ID('dbo.sp_GetCandidates', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_GetCandidates;
IF OBJECT_ID('dbo.sp_AddCandidate', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_AddCandidate;
IF OBJECT_ID('dbo.sp_UpdateCandidate', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_UpdateCandidate;
IF OBJECT_ID('dbo.sp_DeleteCandidate', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_DeleteCandidate;

IF OBJECT_ID('dbo.sp_CastVote', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_CastVote;
IF OBJECT_ID('dbo.sp_GetResults', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_GetResults;

IF OBJECT_ID('dbo.sp_AddFeedback', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_AddFeedback;
IF OBJECT_ID('dbo.sp_GetFeedback', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_GetFeedback;

IF OBJECT_ID('dbo.sp_GenerateOtp', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_GenerateOtp;
IF OBJECT_ID('dbo.sp_VerifyOtp', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_VerifyOtp;
GO

/* ===========================================================
   CANDIDATES
   Used by /api/candidates routes
   =========================================================== */

---------------------------------------------------------------
-- Get candidates (with optional active filter)
---------------------------------------------------------------
CREATE PROCEDURE dbo.sp_GetCandidates
    @OnlyActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.CandidateId      AS Id,
        c.Name,
        c.Position,
        c.Gender,
        c.Manifesto,
        c.PhotoUrl,
        c.IsActive,
        c.CreatedAt
    FROM dbo.Candidates c
    WHERE (@OnlyActive = 0 OR c.IsActive = 1)
    ORDER BY c.Position, c.Name;
END
GO

---------------------------------------------------------------
-- Add candidate
---------------------------------------------------------------
CREATE PROCEDURE dbo.sp_AddCandidate
    @Name       NVARCHAR(200),
    @Position   NVARCHAR(100),
    @Gender     NVARCHAR(20) = NULL,
    @Manifesto  NVARCHAR(1000) = NULL,
    @PhotoUrl   NVARCHAR(500) = NULL,
    @IsActive   BIT = 1,
    @CandidateId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.Candidates (Name, Position, Gender, Manifesto, PhotoUrl, IsActive)
    VALUES (@Name, @Position, @Gender, @Manifesto, @PhotoUrl, @IsActive);

    SET @CandidateId = SCOPE_IDENTITY();
END
GO

---------------------------------------------------------------
-- Update candidate
---------------------------------------------------------------
CREATE PROCEDURE dbo.sp_UpdateCandidate
    @CandidateId INT,
    @Name        NVARCHAR(200),
    @Position    NVARCHAR(100),
    @Gender      NVARCHAR(20) = NULL,
    @Manifesto   NVARCHAR(1000) = NULL,
    @PhotoUrl    NVARCHAR(500) = NULL,
    @IsActive    BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.Candidates
    SET Name      = @Name,
        Position  = @Position,
        Gender    = @Gender,
        Manifesto = @Manifesto,
        PhotoUrl  = @PhotoUrl,
        IsActive  = @IsActive
    WHERE CandidateId = @CandidateId;
END
GO

---------------------------------------------------------------
-- Delete candidate (soft delete to keep votes safe)
---------------------------------------------------------------
CREATE PROCEDURE dbo.sp_DeleteCandidate
    @CandidateId INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.Candidates
    SET IsActive = 0
    WHERE CandidateId = @CandidateId;
END
GO

/* ===========================================================
   VOTING
   Used by /api/votes routes
   =========================================================== */

---------------------------------------------------------------
-- Cast a vote
-- Inputs: VoterId (from JWT), CandidateId
-- Output: VoteId
---------------------------------------------------------------
CREATE PROCEDURE dbo.sp_CastVote
    @VoterId     INT,
    @CandidateId INT,
    @VoteId      INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Position NVARCHAR(100);

    -- Ensure candidate exists and is active
    SELECT @Position = Position
    FROM dbo.Candidates
    WHERE CandidateId = @CandidateId
      AND IsActive = 1;

    IF @Position IS NULL
    BEGIN
        RAISERROR('Candidate not found or inactive.', 16, 1);
        RETURN;
    END

    -- Ensure voter exists
    IF NOT EXISTS (SELECT 1 FROM dbo.Voters WHERE VoterId = @VoterId)
    BEGIN
        RAISERROR('Voter not found.', 16, 1);
        RETURN;
    END

    -- Prevent double voting for same position
    IF EXISTS (SELECT 1 FROM dbo.Votes WHERE VoterId = @VoterId AND Position = @Position)
    BEGIN
        RAISERROR('You have already voted for this position.', 16, 1);
        RETURN;
    END

    INSERT INTO dbo.Votes (VoterId, CandidateId, Position)
    VALUES (@VoterId, @CandidateId, @Position);

    SET @VoteId = SCOPE_IDENTITY();
END
GO

---------------------------------------------------------------
-- Live results
-- Used by /api/votes/results and Results.tsx
---------------------------------------------------------------
CREATE PROCEDURE dbo.sp_GetResults
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.CandidateId,
        c.Name,
        c.Position,
        c.Gender,
        c.PhotoUrl,
        COUNT(v.VoteId) AS VoteCount
    FROM dbo.Candidates c
    LEFT JOIN dbo.Votes v
        ON v.CandidateId = c.CandidateId
    WHERE c.IsActive = 1
    GROUP BY
        c.CandidateId,
        c.Name,
        c.Position,
        c.Gender,
        c.PhotoUrl
    ORDER BY
        c.Position,
        VoteCount DESC,
        c.Name;
END
GO

/* ===========================================================
   FEEDBACK
   Used by /api/feedback routes
   =========================================================== */

---------------------------------------------------------------
-- Add feedback
---------------------------------------------------------------
CREATE PROCEDURE dbo.sp_AddFeedback
    @VoterId   INT = NULL,
    @Message   NVARCHAR(1000),
    @Rating    INT = NULL,
    @FeedbackId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.Feedback (VoterId, Message, Rating)
    VALUES (@VoterId, @Message, @Rating);

    SET @FeedbackId = SCOPE_IDENTITY();
END
GO

---------------------------------------------------------------
-- Get feedback (latest first)
---------------------------------------------------------------
CREATE PROCEDURE dbo.sp_GetFeedback
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        f.FeedbackId,
        f.Message,
        f.Rating,
        f.CreatedAt,
        f.VoterId,
        v.FullName,
        v.Email
    FROM dbo.Feedback f
    LEFT JOIN dbo.Voters v
        ON v.VoterId = f.VoterId
    ORDER BY f.CreatedAt DESC;
END
GO

/* ===========================================================
   OTP (optional – for real OTP if you stop using 123456)
   Not currently called by your frontend, but ready if needed.
   =========================================================== */

---------------------------------------------------------------
-- Generate OTP for a voter
---------------------------------------------------------------
CREATE PROCEDURE dbo.sp_GenerateOtp
    @VoterId INT,
    @Code    NVARCHAR(10) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Raw INT = ABS(CHECKSUM(NEWID())) % 1000000;
    SET @Code = RIGHT('000000' + CAST(@Raw AS NVARCHAR(6)), 6);

    INSERT INTO dbo.OtpCodes (VoterId, Code, ExpiresAt)
    VALUES (@VoterId, @Code, DATEADD(MINUTE, 10, SYSDATETIME()));
END
GO

---------------------------------------------------------------
-- Verify OTP
---------------------------------------------------------------
CREATE PROCEDURE dbo.sp_VerifyOtp
    @VoterId INT,
    @Code    NVARCHAR(10),
    @IsValid BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SET @IsValid = 0;

    DECLARE @OtpId INT;

    SELECT TOP 1
        @OtpId = OtpId
    FROM dbo.OtpCodes
    WHERE VoterId = @VoterId
      AND Code = @Code
      AND IsUsed = 0
      AND ExpiresAt > SYSDATETIME()
    ORDER BY CreatedAt DESC;

    IF @OtpId IS NOT NULL
    BEGIN
        SET @IsValid = 1;

        UPDATE dbo.OtpCodes
        SET IsUsed = 1
        WHERE OtpId = @OtpId;
    END
END
GO
