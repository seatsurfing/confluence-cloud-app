# Confluence Cloud App for Seatsurfing

This is the Confluence Cloud App for Seatsurfing built with Atlassian Connect App using the Express web application framework.

The app basically renders an iFrame and loads the Seatsurfing Booking UI from the configured URL. In order to ensure that the backend knows which user is using Atlassian Confluence, this Confluence App encodes the information about the current user using a symmetrically encoded JWT passed to the configured backend.

The Confluence App is hosted by [Seastsurfing.de](https://seatsurfing.de) and can be installed from the Atlassian Marketplace. User information is not cached at the App's backend and is directly passed to the configured instance URL. There is usually no need to host this Confluence App yourself.

## What's next?
[Seatsurfing for Confluence in the Atlassian Marketplace](https://marketplace.atlassian.com/apps/1224242/seatsurfing-for-confluence)
