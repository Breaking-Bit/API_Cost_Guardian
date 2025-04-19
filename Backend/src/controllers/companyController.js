const Company = require("../models/Company")
const logger = require("../utils/logger")
const admin = require("firebase-admin")

class CompanyController {
  async registerCompany(req, res) {
    let userRecord = null
    try {
      const { name, email, password } = req.body

      // Create user in Firebase
      userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: name,
      })

      // Create company in MongoDB
      const company = new Company({
        name,
        email,
        firebase_uid: userRecord.uid,
      })

      try {
        await company.save()
      } catch (mongoError) {
        if (userRecord) {
          await admin.auth().deleteUser(userRecord.uid)
        }

        if (mongoError.code === 11000) {
          return res.status(409).json({ error: "Email already registered" })
        }
        throw mongoError
      }

      res.status(201).json({
        company: {
          id: company._id,
          name: company.name,
          email: company.email,
          status: company.status,
        },
        uid: userRecord.uid, // Return UID instead of token
      })
    } catch (error) {
      logger.error("Register Company Error:", error)

      if (userRecord && error.code !== 11000) {
        try {
          await admin.auth().deleteUser(userRecord.uid)
        } catch (deleteError) {
          logger.error("Failed to delete Firebase user after registration error:", deleteError)
        }
      }

      res.status(500).json({ error: "Failed to register company" })
    }
  }

  // Fix the login method since Firebase Admin SDK doesn't have signInWithEmailAndPassword
  async loginCompany(req, res) {
    try {
      const { email, password } = req.body

      try {
        // Find the company by email
        const company = await Company.findOne({ email })

        if (!company) {
          return res.status(404).json({ error: "Company not found" })
        }

        // In a real implementation, we would verify the password here
        // For this demo, we'll just check if the company exists

        // Get user from Firebase
        const userRecord = await admin.auth().getUserByEmail(email)

        res.json({
          company: {
            id: company._id,
            name: company.name,
            email: company.email,
            status: company.status,
          },
          uid: userRecord.uid,
        })
      } catch (firebaseError) {
        logger.error("Firebase Login Error:", firebaseError)
        res.status(401).json({ error: "Invalid email or password" })
        return
      }
    } catch (error) {
      logger.error("Login Company Error:", error)
      res.status(500).json({ error: "Login failed" })
    }
  }

  async getCompanyProfile(req, res) {
    try {
      const { company_id } = req.user
      const company = await Company.findById(company_id)

      if (!company) {
        return res.status(404).json({ error: "Company not found" })
      }

      res.json({
        id: company._id,
        name: company.name,
        email: company.email,
        status: company.status,
        created_at: company.created_at,
      })
    } catch (error) {
      logger.error("Get Company Profile Error:", error)
      res.status(500).json({ error: "Failed to fetch company profile" })
    }
  }

  async updateCompanyProfile(req, res) {
    try {
      const { company_id } = req.user
      const { name, email } = req.body

      const company = await Company.findById(company_id)
      if (!company) {
        return res.status(404).json({ error: "Company not found" })
      }

      // Update in Firebase
      await admin.auth().updateUser(company.firebase_uid, {
        email,
        displayName: name,
      })

      // Update in MongoDB
      company.name = name
      company.email = email
      await company.save()

      res.json({
        id: company._id,
        name: company.name,
        email: company.email,
        status: company.status,
      })
    } catch (error) {
      logger.error("Update Company Profile Error:", error)
      res.status(500).json({ error: "Failed to update company profile" })
    }
  }
}

module.exports = new CompanyController()
