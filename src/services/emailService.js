// Mock email service for notification stubs
class EmailService {
  constructor() {
    this.templates = {
      listingSubmitted: {
        subject: 'Car Listing Submitted Successfully',
        template: 'Your car listing "{title}" has been submitted and is pending review. We\'ll notify you once it\'s approved.'
      },
      listingApproved: {
        subject: 'Car Listing Approved!',
        template: 'Great news! Your car listing "{title}" has been approved and is now live on our platform.'
      },
      listingRejected: {
        subject: 'Car Listing Requires Updates',
        template: 'Your car listing "{title}" needs some updates before approval. Please check your dashboard for details.'
      },
      adminNotification: {
        subject: 'New Listing Pending Review',
        template: 'A new car listing "{title}" by {sellerName} requires admin review.'
      }
    }
  }

  // Send notification after seller submits listing
  async sendListingSubmittedNotification(listing, sellerEmail) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const template = this.templates.listingSubmitted
        const emailData = {
          to: sellerEmail,
          subject: template.subject,
          message: template.template.replace('{title}', listing.title),
          timestamp: new Date().toISOString(),
          type: 'listing_submitted'
        }
        
        console.log('📧 Email sent:', emailData)
        
        resolve({
          success: true,
          messageId: 'msg_' + Math.random().toString(36).substr(2, 9),
          emailData
        })
      }, 500) // Simulate email service delay
    })
  }

  // Send notification after admin approves listing
  async sendListingApprovedNotification(listing, sellerEmail) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const template = this.templates.listingApproved
        const emailData = {
          to: sellerEmail,
          subject: template.subject,
          message: template.template.replace('{title}', listing.title),
          timestamp: new Date().toISOString(),
          type: 'listing_approved'
        }
        
        console.log('📧 Email sent:', emailData)
        
        resolve({
          success: true,
          messageId: 'msg_' + Math.random().toString(36).substr(2, 9),
          emailData
        })
      }, 500)
    })
  }

  // Send notification after admin rejects listing
  async sendListingRejectedNotification(listing, sellerEmail, reason = 'Please check listing details') {
    return new Promise((resolve) => {
      setTimeout(() => {
        const template = this.templates.listingRejected
        const emailData = {
          to: sellerEmail,
          subject: template.subject,
          message: template.template.replace('{title}', listing.title) + ` Reason: ${reason}`,
          timestamp: new Date().toISOString(),
          type: 'listing_rejected'
        }
        
        console.log('📧 Email sent:', emailData)
        
        resolve({
          success: true,
          messageId: 'msg_' + Math.random().toString(36).substr(2, 9),
          emailData
        })
      }, 500)
    })
  }

  // Send notification to admin when new listing is submitted
  async sendAdminNewListingNotification(listing, sellerName, adminEmail = 'admin@bharatautobazaar.com') {
    return new Promise((resolve) => {
      setTimeout(() => {
        const template = this.templates.adminNotification
        const emailData = {
          to: adminEmail,
          subject: template.subject,
          message: template.template
            .replace('{title}', listing.title)
            .replace('{sellerName}', sellerName),
          timestamp: new Date().toISOString(),
          type: 'admin_notification'
        }
        
        console.log('📧 Email sent:', emailData)
        
        resolve({
          success: true,
          messageId: 'msg_' + Math.random().toString(36).substr(2, 9),
          emailData
        })
      }, 500)
    })
  }

  // Batch send notifications
  async sendBulkNotifications(notifications) {
    const results = []
    
    for (const notification of notifications) {
      const { type, data } = notification
      
      let result
      switch (type) {
        case 'listing_submitted':
          result = await this.sendListingSubmittedNotification(data.listing, data.sellerEmail)
          break
        case 'listing_approved':
          result = await this.sendListingApprovedNotification(data.listing, data.sellerEmail)
          break
        case 'listing_rejected':
          result = await this.sendListingRejectedNotification(data.listing, data.sellerEmail, data.reason)
          break
        case 'admin_notification':
          result = await this.sendAdminNewListingNotification(data.listing, data.sellerName, data.adminEmail)
          break
        default:
          result = { success: false, error: 'Unknown notification type' }
      }
      
      results.push(result)
    }
    
    return {
      success: true,
      results,
      totalSent: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length
    }
  }

  // Get email template preview
  getTemplatePreview(templateType, variables = {}) {
    const template = this.templates[templateType]
    if (!template) {
      return { error: 'Template not found' }
    }

    let message = template.template
    Object.keys(variables).forEach(key => {
      message = message.replace(new RegExp(`{${key}}`, 'g'), variables[key])
    })

    return {
      subject: template.subject,
      message,
      type: templateType
    }
  }
}

export const emailService = new EmailService()
export default emailService 