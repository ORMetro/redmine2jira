# Migrating Redmine to jira

1. `npm install`
2. Copy `settings.ini.example` to `settings.ini` and add secret information about our server, logins, API keys and about the specific projects.
3. Set up your project in JIRA
4. Run the script with `npm run start` and modify bits and bobs until you stop getting errors.
   > After running for the first time, the script will generate a file called `issues.json`. This is data from Redmine. When you run the script again, it won't need to download data from Redmine.
   > 
   > The script will also create a file called `output.json`. This is the file to import to Jira.

5. In your Jira project, upload find the import tool (gear -> system -> External system Import, or https://subdomain.atlassian.net/secure/admin/ExternalImport1.jspa) and upload the`output.json` file.
6. Jira isn't allowed to view attachments on Redmine, so you'll have to find a workaround*.
7. Follow the Jira wizard and import your file! You may get some errors and need to tweak things. You can bulk delete and do it again and again until you are satisfied.

*Sample workaround to always allow access to attachments in Redmine:

```
Index: app/controllers/application.rb
===================================================================
--- app/controllers/application.rb	(revision 1715)
+++ app/controllers/application.rb	(working copy)
@@ -79,6 +79,9 @@
   
   def require_login
     if !User.current.logged?
+      if controller_class_name == "AttachmentsController"
+        return true
+      end
       redirect_to :controller => "account", :action => "login", :back_url => request.request_uri
       return false
     end
```