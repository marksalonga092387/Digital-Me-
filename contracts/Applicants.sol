pragma solidity >=0.4.21 <0.7.0;

import "./Migrations.sol";
pragma experimental ABIEncoderV2;

contract Applicants {
    enum ExpDurationMonth {Zero, January, February, March, April, May, June, July, August, September, October, November, December}
    enum SkillLevel {Default, Beginner, Intermediate, Advanced}
    enum ProficiencyLevel {Default, Novice, Fluent, Intermediate, Advanced, Superior} // Customized ACTFL Proficiency (American Council on the Teaching of Foreign Language)

    struct Applicant {
        // Personal Information
        string name;
            uint nameChanges;
        string physicalAddress;
        string location;
        string nationality;
        bool exists;

        // Experiences
        string[] experienceIdentifiers;

        // SKills
        string[] skillIdentifiers;

        // Identifications
        string[] identificationIdentifiers;

        // Salary Preference
        Stipend salaryFlooring;
        Stipend salaryCeiling;
    }

    struct Language {
        string name;
        ProficiencyLevel spokenProficiency;
        ProficiencyLevel writtenProficiency;
        bool exists;
    }

    struct Skill {
        string name;
        SkillLevel level;
        bool exists;
    }

    struct Experience {
        string positionTitle;
        string companyName;
        ExpDurationStart start;
        ExpDurationEnd end;
        string specialization;
        string role;
        string country;
        string industry;
        string positionLevel;
        Stipend monthlySalary;
        string description;
        bool exists;
    }

    struct ExpDurationEnd {
        uint year;
        Applicants.ExpDurationMonth ExpDurationMonth;
        bool present;
    }

    struct ExpDurationStart {
        uint year;
        Applicants.ExpDurationMonth ExpDurationMonth;
    }

    struct Stipend {
        string currency;
        uint amount;
    }

    struct Identification {
        string filename;
        bool exists;
    }

    mapping (address => Applicant) applicants;
    address[] applicantAccts;
    mapping (string => Experience) experiences;
    mapping (string => Skill) skills;
    mapping (string => Identification) identifications;


    event ApplicantsAppend (address indexed _address);

    // Identifications

    function updateIdentification(
        address _address, string memory _fileName
    ) public returns (bool, string memory) {
        string memory tempFileNameIdentifier = string(abi.encodePacked(addressToString(_address), "-", _fileName));
        if (msg.sender == _address) {
            Identification storage identification = identifications[tempFileNameIdentifier];
            identification.filename = _fileName;
            identification.exists = true;
            bool _identificationFound;
            uint _identificationIndex;
            (_identificationFound, _identificationIndex) = identificationFound(_address, tempFileNameIdentifier, "");
            if (_identificationFound == false && identifications[tempFileNameIdentifier].exists) {
                applicants[_address].identificationIdentifiers.push(tempFileNameIdentifier);
            }
            return (true, "");
        } else {
            return (false, "Account holder does not exists or you are not the holder of this account.");
        }
    }

    function identificationFound(address _address, string memory _fileName, string memory _administrativeCode) public view returns (bool, uint) {
        if ((msg.sender == _address) || (compareStrings(_administrativeCode, "sudo"))) {
            bool found = false;
            uint index = 0;
            for (uint i = 0; i < applicants[_address].identificationIdentifiers.length; i++) {
                if (compareStrings(applicants[_address].identificationIdentifiers[i], _fileName)) {
                    found = true;
                    index = i;
                }
            }
            if (found) {
                return (true, index);
            } else {
                return (false, 0);
            }
        } else {
            return (false, 0);
        }
    }

    function getIdentificationDetails(address _address, string memory _fileName, string memory _administrativeCode) view public returns (Identification memory) {
        if ((compareStrings(_administrativeCode,"sudo") && msg.sender != _address) || (msg.sender == _address)) {
            bool _identificationExists;
            uint _identificationIndex;
            (_identificationExists, _identificationIndex) = identificationFound(_address, _fileName, _administrativeCode);
            if (identifications[_fileName].exists == true && _identificationExists) {
                return identifications[_fileName];
            }
        }
    }

    function deleteIdentification(address _address, string memory _fileName) public returns (bool, string memory) {
        if (_address == msg.sender) {
            bool _idenficationFound;
            uint _identificationIndex;
            (_idenficationFound, _identificationIndex) = identificationFound(_address, _fileName, "");
            if (_idenficationFound == true && identifications[_fileName].exists) {
                identifications[_fileName].exists = false;
                for (uint i = _identificationIndex; i<applicants[_address].identificationIdentifiers.length-1; i++){
                    applicants[_address].identificationIdentifiers[i] = applicants[_address].identificationIdentifiers[i+1];
                }
                delete applicants[_address].identificationIdentifiers[applicants[_address].identificationIdentifiers.length-1];
                applicants[_address].identificationIdentifiers.length-=1;
                return (true, "");
            }
            return (true, "");
        } else {
            return (false, "One must be able to change own identifications by logging in with one's own address");
        }
    }

    // Applicants

    function setApplicant (address _address, string memory _name, string memory _physicalAddress, string memory _location, string memory _nationality, string memory _administrativeCode) public returns (bool) {
        if (!applicants[_address].exists && compareStrings(_administrativeCode,"sudo")) {
            Applicant storage applicant = applicants[_address];
            applicant.name = _name;
            applicant.nameChanges = 0;
            if (compareStrings(_physicalAddress,"")) {
                applicants[_address].physicalAddress = "---";
            } else {
                applicants[_address].physicalAddress = _physicalAddress;
            }
            if (compareStrings(_physicalAddress,"")) {
                applicants[_address].nationality = "---";
            } else {
                applicants[_address].nationality = _nationality;
            }
            if (compareStrings(_location,"")) {
                applicants[_address].location = "---";
            } else {
                applicants[_address].location = _location;
            }
            applicants[_address].salaryFlooring = createStipend("Php", 0);
            applicants[_address].salaryCeiling = createStipend("Php", 0);
            applicant.exists = true;
            applicantAccts.push(_address);
            emit Applicants.ApplicantsAppend(_address);
            return true;
        } else {
            return false;
        }
    }

    function getApplicants(string memory _administrativeCode) view public returns(address[] memory) {
        if (compareStrings(_administrativeCode,"sudo")) {
            return applicantAccts;
        }
    }

    function getApplicantProfile(address _address, string memory _administrativeCode) view public returns(Applicant memory) {
        if ((compareStrings(_administrativeCode,"sudo") && msg.sender != _address) || (msg.sender == _address)) {
            return applicants[_address];
        }
    }

    function updateName (address _address, string memory _name) public returns (bool, uint, string memory) {
        if (applicants[_address].exists && msg.sender == _address) {
            if (applicants[_address].nameChanges < 3) {
                applicants[_address].name = _name;
                applicants[_address].nameChanges+=1;
                return (true, 3-applicants[_address].nameChanges, "Name changed!" );
            } else {
                return (false, applicants[_address].nameChanges, "This account exceeds in the number of name changes.");
            }
        } else {
            return (false, 0, "Account holder does not exists or you are not the holder of this account.");
        }
    }

    function updateAddress(address _address, string memory _physicalAddress) public returns (bool, string memory) {
        if (applicants[_address].exists && msg.sender == _address) {
            applicants[_address].physicalAddress = _physicalAddress;
            return (true, "");
        } else {
            return (false, "Account holder does not exists or you are not the holder of this account.");
        }
    }

    function updateNationality(address _address, string memory _nationality) public returns (bool, string memory) {
        if (applicants[_address].exists && msg.sender == _address) {
            applicants[_address].nationality = _nationality;
            return (true, "");
        } else {
            return (false, "Account holder does not exists or you are not the holder of this account.");
        }
    }

    // Salary Preference Functions

    function setSalaryFlooring(address _address, string memory _currency, uint _amount) public returns (bool, string memory){
        if (msg.sender == _address) {
            if (compareStrings(_currency,"")) {
                applicants[_address].salaryFlooring = createStipend("---", _amount);
                return (true, "");
            } else {
                applicants[_address].salaryFlooring = createStipend(_currency, _amount);
                return (true, "");
            }
        } else {
            return (false, "Account holder does not exists or you are not the holder of this account.");
        }
    }

    function setSalaryCeiling(address _address, string memory _currency, uint _amount) public returns (bool, string memory){
        if (msg.sender == _address) {
            if (compareStrings(_currency,"")) {
                applicants[_address].salaryCeiling = createStipend("---", _amount);
                return (true, "");
            } else {
                applicants[_address].salaryCeiling = createStipend(_currency, _amount);
                return (true, "");
            }
        } else {
            return (false, "Account holder does not exists or you are not the holder of this account.");
        }
    }

    // Skill Functions

    function getSkillDetails(address _address, string memory _skillName, string memory _administrativeCode) view public returns (Skill memory) {
        if ((compareStrings(_administrativeCode,"sudo") && msg.sender != _address) || (msg.sender == _address)) {
            bool _skillExists;
            uint _skillIndex;
            (_skillExists, _skillIndex) = skillFound(_address, _skillName, _administrativeCode);
            if (skills[_skillName].exists == true && _skillExists) {
                return skills[_skillName];
            }
        }
    }

    function updateSkill(
        address _address, string memory _skillName,
        uint _level
    ) public returns (bool, string memory) {
        string memory tempSkillIdentifier = string(abi.encodePacked(addressToString(_address), "-", _skillName));
        if (msg.sender == _address) {
            Skill storage skill = skills[tempSkillIdentifier];
            skill.name = _skillName;
            skill.level = selectSkillLevel(_level);
            skill.exists = true;
            bool _skillFound;
            uint _skillIndex;
            (_skillFound, _skillIndex) = skillFound(_address, tempSkillIdentifier, "");
            if (_skillFound == false && skills[tempSkillIdentifier].exists) {
                applicants[_address].skillIdentifiers.push(tempSkillIdentifier);
            }
            return (true, "");
        } else {
            return (false, "Account holder does not exists or you are not the holder of this account.");
        }
    }

    function skillFound(address _address, string memory _skillName, string memory _administrativeCode) public view returns (bool, uint) {
        if ((msg.sender == _address) || (compareStrings(_administrativeCode, "sudo"))) {
            bool found = false;
            uint index = 0;
            for (uint i = 0; i < applicants[_address].skillIdentifiers.length; i++) {
                if (compareStrings(applicants[_address].skillIdentifiers[i], _skillName)) {
                    found = true;
                    index = i;
                }
            }
            if (found) {
                return (true, index);
            } else {
                return (false, 0);
            }
        } else {
            return (false, 0);
        }
    }

    function deleteSkill(address _address, string memory _skillName) public returns (bool, string memory) {
        if (_address == msg.sender) {
            bool _skillFound;
            uint _skillIndex;
            (_skillFound, _skillIndex) = skillFound(_address, _skillName, "");
            if (_skillFound == true && skills[_skillName].exists) {
                skills[_skillName].exists = false;
                for (uint i = _skillIndex; i<applicants[_address].skillIdentifiers.length-1; i++){
                    applicants[_address].skillIdentifiers[i] = applicants[_address].skillIdentifiers[i+1];
                }
                delete applicants[_address].skillIdentifiers[applicants[_address].skillIdentifiers.length-1];
                applicants[_address].skillIdentifiers.length-=1;
                return (true, "");
            }
            return (true, "");
        } else {
            return (false, "One must be able to change own skills by logging in with one's own address");
        }
    }

    // Experience Functions

    function getExperienceDetails(address _address, string memory _experienceName, string memory _administrativeCode) view public returns (Experience memory) {
        if ((compareStrings(_administrativeCode,"sudo") && msg.sender != _address) || (msg.sender == _address)) {
            bool _experienceExists;
            uint _experienceIndex;
            (_experienceExists, _experienceIndex) = experienceFound(_address, _experienceName, _administrativeCode);
            if (experiences[_experienceName].exists == true && _experienceExists) {
                return experiences[_experienceName];
            }
        }
    }

    function updateExperience(
        address _address, string memory _experienceName,
        string[] memory _details, uint[] memory _start, uint[] memory _end, bool _present,
        string memory _currency, uint _amount
    ) public returns (bool, string memory) {
        string memory tempExperienceIdentifier = string(abi.encodePacked(addressToString(_address), "-", _experienceName));
        if (msg.sender == _address) {
            Experience storage experience = experiences[tempExperienceIdentifier];
            experience.positionTitle = _details[0];
            experience.companyName = _details[1];
            experience.specialization = _details[2];
            experience.role = _details[3];
            experience.country = _details[4];
            experience.industry = _details[5];
            experience.positionLevel = _details[6];
            experience.description = _details[7];
            experience.start = createExpDurationStart(_start[0], _start[1]);
            experience.end = createExpDurationEnd(_end[0], _end[1], _present);
            experience.monthlySalary = createStipend(_currency, _amount);
            experience.exists = true;
            bool _experienceFound;
            uint _experienceIndex;
            (_experienceFound, _experienceIndex) = experienceFound(_address, tempExperienceIdentifier, "");
            if (_experienceFound == false && experiences[tempExperienceIdentifier].exists) {
                applicants[_address].experienceIdentifiers.push(tempExperienceIdentifier);
            }
            return (true, "");
        } else {
            return (false, "Account holder does not exists or you are not the holder of this account.");
        }
    }

    function experienceFound(address _address, string memory _experienceName, string memory _administrativeCode) public view returns (bool, uint) {
        if ((msg.sender == _address) || (compareStrings(_administrativeCode, "sudo"))) {
            bool found = false;
            uint index = 0;
            for (uint i = 0; i < applicants[_address].experienceIdentifiers.length; i++) {
                if (compareStrings(applicants[_address].experienceIdentifiers[i], _experienceName)) {
                    found = true;
                    index = i;
                }
            }
            if (found) {
                return (true, index);
            } else {
                return (false, 0);
            }
        } else {
            return (false, 0);
        }
    }

    function deleteExperience(address _address, string memory _experienceName) public returns (bool, string memory) {
        if (_address == msg.sender) {
            bool _experienceFound;
            uint _experienceIndex;
            (_experienceFound, _experienceIndex) = experienceFound(_address, _experienceName, "");
            if (_experienceFound == true && experiences[_experienceName].exists) {
                experiences[_experienceName].exists = false;
                for (uint i = _experienceIndex; i<applicants[_address].experienceIdentifiers.length-1; i++){
                    applicants[_address].experienceIdentifiers[i] = applicants[_address].experienceIdentifiers[i+1];
                }
                delete applicants[_address].experienceIdentifiers[applicants[_address].experienceIdentifiers.length-1];
                applicants[_address].experienceIdentifiers.length-=1;
                return (true, "");
            }
            return (true, "");
        } else {
            return (false, "One must be able to change own experiences by logging in with one's own address");
        }
    }


    // Auxiliary Functions
    function compareStrings (string memory a, string memory b) public pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }

    function addressToString (address x) public pure returns (string memory) {
        bytes32 value = bytes32(uint256(x));
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint i = 0; i < 20; i++) {
            str[2+i*2] = alphabet[uint(uint8(value[i + 12] >> 4))];
            str[3+i*2] = alphabet[uint(uint8(value[i + 12] & 0x0f))];
        }
        return string(str);
    }

    function selectExpDurationMonth (uint _monthIndex) internal pure returns (Applicants.ExpDurationMonth) {
        if (_monthIndex == 1) return Applicants.ExpDurationMonth.January;
        if (_monthIndex == 2) return Applicants.ExpDurationMonth.February;
        if (_monthIndex == 3) return Applicants.ExpDurationMonth.March;
        if (_monthIndex == 4) return Applicants.ExpDurationMonth.April;
        if (_monthIndex == 5) return Applicants.ExpDurationMonth.May;
        if (_monthIndex == 6) return Applicants.ExpDurationMonth.June;
        if (_monthIndex == 7) return Applicants.ExpDurationMonth.July;
        if (_monthIndex == 8) return Applicants.ExpDurationMonth.August;
        if (_monthIndex == 9) return Applicants.ExpDurationMonth.September;
        if (_monthIndex == 10) return Applicants.ExpDurationMonth.October;
        if (_monthIndex == 11) return Applicants.ExpDurationMonth.November;
        if (_monthIndex == 12) return Applicants.ExpDurationMonth.December;
        return Applicants.ExpDurationMonth.Zero;
    }

    function selectSkillLevel (uint _levelIndex) internal pure returns (Applicants.SkillLevel) {
        if (_levelIndex == 1) return Applicants.SkillLevel.Beginner;
        if (_levelIndex == 2) return Applicants.SkillLevel.Intermediate;
        if (_levelIndex == 3) return Applicants.SkillLevel.Advanced;
        return Applicants.SkillLevel.Default;
    }

    function createExpDurationStart (uint _year, uint _month) internal pure returns (Applicants.ExpDurationStart memory) {
        return Applicants.ExpDurationStart(uint(_year), selectExpDurationMonth(_month));
    }

    function createExpDurationEnd (uint _year, uint _month, bool _present) internal pure returns (Applicants.ExpDurationEnd memory) {
        return Applicants.ExpDurationEnd(uint(_year), selectExpDurationMonth(_month), _present);
    }

    function createStipend (string memory _currency, uint _amount) internal pure returns (Applicants.Stipend memory){
        return Applicants.Stipend(_currency, _amount);
    }
}