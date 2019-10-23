namespace Website
{
    using System;
    using System.Collections.Generic;
    using System.Data.Entity;

    public partial class WebsiteDataContext: DbContext
    {
        public WebsiteDataContext() : base("name=website_data")
        {
        }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            Mobro2016Vote.GetModelBuilder(modelBuilder);
            Mobro2017Vote.GetModelBuilder(modelBuilder);
        }
    }
}
