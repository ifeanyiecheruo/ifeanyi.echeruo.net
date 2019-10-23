using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Data.Entity.Migrations;

namespace Website.mobro._2016
{
    public class VotesStore
    {
        public async Task ResetAsync()
        {
            using (var context = new WebsiteDataContext())
            {
                context.Mobro2016Votes.RemoveRange(context.Mobro2016Votes.AsEnumerable());
                var _ = await context.SaveChangesAsync().ConfigureAwait(false);
            }

            using (var context = new WebsiteDataContext())
            {
                this.AddVote(context, Guid.NewGuid().ToString(), "barry-stache");
                this.AddVote(context, Guid.NewGuid().ToString(), "biker-stache");
                this.AddVote(context, Guid.NewGuid().ToString(), "groucho-stache");
                this.AddVote(context, Guid.NewGuid().ToString(), "logan-stache");
                this.AddVote(context, Guid.NewGuid().ToString(), "mutton-chops-stache");
                this.AddVote(context, Guid.NewGuid().ToString(), "price-stache");
                this.AddVote(context, Guid.NewGuid().ToString(), "stark-stache");
                this.AddVote(context, Guid.NewGuid().ToString(), "tai-chi-master-stache");

                var _ = await context.SaveChangesAsync().ConfigureAwait(false);
            }
        }

        public async Task<bool> AddVoteAsync(string userId, string category)
        {
            using (var context = new WebsiteDataContext())
            {
                context.Mobro2016Votes.AddOrUpdate(new Mobro2016Vote(userId, category));
                var _ = await context.SaveChangesAsync().ConfigureAwait(false);
            }

            return true;
        }

        public async Task<IDictionary<string, int>> GetVoteCountByCategoryAsync()
        {
            var result = new Dictionary<string, int>();

            using (var context = new WebsiteDataContext())
            {
                var countsByCategory = from vote in context.Mobro2016Votes
                                       group vote by vote.Category into category
                                       select new
                                       {
                                           Name = category.Key,
                                           Count = category.Count()
                                       };

                result = countsByCategory.ToDictionary(_ => _.Name, _ => _.Count);
            }

            if (result.Count == 0)
            {
                await this.ResetAsync().ConfigureAwait(false);
            }

            return result;
        }
        void AddVote(WebsiteDataContext context, string userId, string category)
        {
            context.Mobro2016Votes.AddOrUpdate(new Mobro2016Vote(userId, category));
        }
    }
}