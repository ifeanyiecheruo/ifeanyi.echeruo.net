namespace Website
{
    using System;
    using System.Data.Entity;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Linq;

    public partial class WebsiteDataContext : DbContext
    {
        public DbSet<Mobro2017Vote> Mobro2017Votes { get; set; }
    }


    public class Mobro2017Vote
    {
        public Mobro2017Vote()
        {
        }

        public Mobro2017Vote(string userId, string category)
        {
            this.UserId = userId;
            this.Category = category;
        }

        public string UserId { get; set; }
        public string Category { get; set; }

        public static Action<DbModelBuilder> GetModelBuilder = (DbModelBuilder modelBuilder) =>
        {
            var votesEntity = modelBuilder.Entity<Mobro2017Vote>();
            votesEntity.HasKey(_ => _.UserId);
            votesEntity.Property(_ => _.UserId).IsRequired();
            votesEntity.Property(_ => _.Category).IsRequired();
        };
    }
}
