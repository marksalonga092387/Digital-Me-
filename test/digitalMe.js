const Applicants = artifacts.require("Applicants");

contract ("Applicants", (accounts) => {
    it(' should add new applicants to the applicants set', async () => {
        const aplcnt = await Applicants.deployed();
        await aplcnt.setApplicant(accounts[0], "Jimwel Anobong", "", "", "sudo");
        const jimwel = await aplcnt.getApplicantProfile(accounts[0],"");
        const jimwelName = jimwel['name'];
        assert.equal(jimwelName, "Jimwel Anobong", " Jimwel must be the first applicant in the applicants set");
    });
    it(' should be able to rename applicant up to three times', async () => {
        const aplcnt = await Applicants.deployed();
        await aplcnt.updateName(accounts[0], "Jep Lusterio");
        await aplcnt.updateName(accounts[0], "Kenneth Rosario Doria");
        await aplcnt.updateName(accounts[0], "Mario Marzo Peralta Jr.");
        const applicant = await aplcnt.getApplicantProfile(accounts[0], "");
        const name = applicant["name"];
        assert.equal(name, "Mario Marzo Peralta Jr.", " Mario Marzo Peralta Jr. must be the name of the first account");
    });
    it (' should be able to add applicant\'s experiences', async () => {
        const aplcnt = await Applicants.deployed();
        await aplcnt.updateExperience(
            accounts[0],
            "unionbank",
            [
                "Region Manager", // Position Title
                "Unionbank PH", // Company Name
                "IT Department", // Specialization
                "---", // Role
                "Philippines", // Country
                "---", // Industry
                "---", // Position Level
                "---", // Description
            ],
            [2020, 3],
            [2020, 3],
            true,
            "Php",
            200000
        );
       await aplcnt.updateExperience(
            accounts[0],
            "unionbank2",
            [
                "Branch Manager", // Position Title
                "Unionbank", // Company Name
                "IT Department", // Specialization
                "---", // Role
                "Philippines", // Country
                "---", // Industry
                "---", // Position Level
                "---", // Description
            ],
            [2020, 3],
            [2020, 3],
            true,
            "Php",
            200000
        );
        let applicant = await aplcnt.getApplicantProfile(accounts[0],"");
        const experienceDetails = await aplcnt.getExperienceDetails(accounts[0], applicant.experienceIdentifiers[0], "");
        const specialization = experienceDetails["specialization"];
        assert.equal(specialization, "IT Department", " The first experience's specialization must be \"IT Department\"");
    });
    it (' should be able to update applicant\'s experiences', async () => {
        const aplcnt = await Applicants.deployed();
        await aplcnt.updateExperience(
            accounts[0],
            "unionbank2",
            [
                "Branch Manager", // Position Title
                "Unionbank US", // Company Name
                "IT Department 2", // Specialization
                "---", // Role
                "Philippines 2", // Country
                "---", // Industry
                "---", // Position Level
                "---", // Description
            ],
            [2020, 3],
            [2020, 3],
            true,
            "Php",
            200000
        );
        let applicant = await aplcnt.getApplicantProfile(accounts[0],"");
        const experienceDetails = await aplcnt.getExperienceDetails(accounts[0], applicant.experienceIdentifiers[1], "");
        assert.equal(experienceDetails["specialization"], "IT Department 2", " The first experience's specialization must be \"IT Department 2\"");
    });
    it (' should be able to delete applicant\'s experiences', async () => {
        const aplcnt = await Applicants.deployed();
        let applicant = await aplcnt.getApplicantProfile(accounts[0],"");
        await aplcnt.deleteExperience(accounts[0], applicant.experienceIdentifiers[0]);
        applicant = await aplcnt.getApplicantProfile(accounts[0],"");

        assert.equal(applicant["experienceIdentifiers"].length, 1, " There must only be one experience included in Jimwel's applicant profile. ");
    });
    it (' should be able to add applicant\'s skills', async () => {
        const aplcnt = await Applicants.deployed();
        await aplcnt.updateSkill(
            accounts[0],
            "programming",
            1
        );
        await aplcnt.updateSkill(
            accounts[0],
            "reading",
            2
        );
        let applicant = await aplcnt.getApplicantProfile(accounts[0],"");
        const skillDetails = await aplcnt.getSkillDetails(accounts[0], applicant.skillIdentifiers[0], "");
        const programming = skillDetails["name"];
        assert.equal(programming, "programming", " The first skill's name must be \"programming\"");
    });
    it (' should be able to update applicant\'s skills', async () => {
        const aplcnt = await Applicants.deployed();
        await aplcnt.updateSkill(
            accounts[0],
            "programming",
            3
        );
        await aplcnt.updateSkill(
            accounts[0],
            "reading",
            3
        );
        let applicant = await aplcnt.getApplicantProfile(accounts[0],"");
        const skillDetails = await aplcnt.getSkillDetails(accounts[0], applicant.skillIdentifiers[1], "");
        assert.equal(skillDetails["level"], 3, " The first skill's level must be \"3. Advanced\"");
    });
    it (' should be able to delete applicant\'s skills', async () => {
        const aplcnt = await Applicants.deployed();
        let applicant = await aplcnt.getApplicantProfile(accounts[0],"");
        await aplcnt.deleteSkill(accounts[0], applicant.skillIdentifiers[0]);
        applicant = await aplcnt.getApplicantProfile(accounts[0],"");
        assert.equal(applicant["skillIdentifiers"].length, 1, " There must only be one skill included in Jimwel's applicant profile. ");
    });
    it (' should be able to update applicant\'s salary flooring', async () => {
        const aplcnt = await Applicants.deployed();
        await aplcnt.setSalaryFlooring(accounts[0], "Php", 20000);
        let applicant = await aplcnt.getApplicantProfile(accounts[0],"");
        assert.equal(applicant["salaryFlooring"]["amount"], 20000, " The new value of the salary flooring must be 20000. ");
    });
    it (' should be able to update applicant\'s salary ceiling', async () => {
        const aplcnt = await Applicants.deployed();
        await aplcnt.setSalaryCeiling(accounts[0], "Php", 30000);
        let applicant = await aplcnt.getApplicantProfile(accounts[0],"");
        assert.equal(applicant["salaryCeiling"]["amount"], 30000, " The new value of the salary ceiling must be 30000. ");
    });
    it (' should be able to add identification', async () => {
        const aplcnt = await Applicants.deployed();
        await aplcnt.updateIdentification(accounts[0], "sss");
        let applicant = await aplcnt.getApplicantProfile(accounts[0],"");
        const identificationDetails = await aplcnt.getIdentificationDetails(accounts[0], applicant.identificationIdentifiers[0], "");
        assert.equal(identificationDetails["filename"], "sss", " The filename must be \"sss\"");
    });
    it (' should be able to delete identification', async () => {
        const aplcnt = await Applicants.deployed();
        let applicant = await aplcnt.getApplicantProfile(accounts[0],"");
        await aplcnt.deleteIdentification(accounts[0], applicant.identificationIdentifiers[0]);
        applicant = await aplcnt.getApplicantProfile(accounts[0],"");
        assert.equal(applicant["identificationIdentifiers"].length, 0, "There must be no identifications linked to this account.");
    });
});