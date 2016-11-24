using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Table;

namespace Website.mobro._2016
{
    public class VotesStore
    {
        public static VotesStore FromSecret(string path) {
            var physicalPath = HttpContext.Current.Server.MapPath(path);

            if (!File.Exists(physicalPath)) {
                throw new FileNotFoundException("Expecting a file containing an Azure storage connection string", path);
            }

            var connectionString = File.ReadAllText(physicalPath).Trim();

            return new VotesStore(connectionString);
        }

        public VotesStore(string connectionString)
        {
            storageAccount = CloudStorageAccount.Parse(connectionString);
            tableClient = storageAccount.CreateCloudTableClient();
            votesTable = tableClient.GetTableReference("votes");

            votesTable.CreateIfNotExists();
        }

        public async Task ResetAsync()
        {
            await votesTable.DeleteAsync();

            while (true)
            {
                try
                {
                    await votesTable.CreateIfNotExistsAsync();
                    break;
                }
                catch (StorageException)
                {
                    Thread.Sleep(TimeSpan.FromSeconds(2));
                }
            }

            await this.AddVoteAsync(Guid.NewGuid().ToString(), "barry-stache");
            await this.AddVoteAsync(Guid.NewGuid().ToString(), "biker-stache");
            await this.AddVoteAsync(Guid.NewGuid().ToString(), "groucho-stache");
            await this.AddVoteAsync(Guid.NewGuid().ToString(), "logan-stache");
            await this.AddVoteAsync(Guid.NewGuid().ToString(), "mutton-chops-stache");
            await this.AddVoteAsync(Guid.NewGuid().ToString(), "price-stache");
            await this.AddVoteAsync(Guid.NewGuid().ToString(), "stark-stache");
            await this.AddVoteAsync(Guid.NewGuid().ToString(), "tai-chi-master-stache");
        }

        public async Task<bool> AddVoteAsync(string userId, string category)
        {
            await votesTable.ExecuteAsync(TableOperation.InsertOrReplace(new VoteEntity(userId, category)));

            return true;
        }

        public IDictionary<string, int> GetVoteCountByCategory()
        {
            var result = new Dictionary<string, int>();

            foreach (var vote in votesTable.CreateQuery<VoteEntity>())
            {
                int votes;

                if (result.TryGetValue(vote.Category, out votes))
                {
                    votes++;
                } else
                {
                    votes = 1;
                }

                result[vote.Category] = votes;
            }

            return result;
        }

        private readonly CloudStorageAccount storageAccount;
        private readonly CloudTableClient tableClient;
        private readonly CloudTable votesTable;
    }

    public class VoteEntity : TableEntity
    {
        public VoteEntity()
        {
        }

        public VoteEntity(string userId, string category)
        {
            this.PartitionKey = "partition";
            this.UserId = userId;
            this.Category = category;
        }

        public string UserId { 
            get { return this.RowKey; }
            set { this.RowKey = value; }
        }

        public string Category {
            get;
            set;
        }
    }
}