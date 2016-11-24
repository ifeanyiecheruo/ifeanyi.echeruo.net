using System;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Principal;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Filters;

namespace Website.mobro._2016
{
    public class CookieAuthenticationAttribute : Attribute, IAuthenticationFilter
    {
        const string userIdCookieName = "userid";

        Task IAuthenticationFilter.AuthenticateAsync(HttpAuthenticationContext context, CancellationToken cancellationToken)
        {
            var userIdCookie = context.Request.Headers.GetCookies(userIdCookieName).FirstOrDefault();
            string userId;
            if (userIdCookie != null)
            {
                userId = userIdCookie[userIdCookieName].Value;
            }
            else
            {
                userId = Guid.NewGuid().ToString();
            }

            context.Principal = new GenericPrincipal(new GenericIdentity(userId), new string[] { });

            return Task.FromResult(0);
        }

        Task IAuthenticationFilter.ChallengeAsync(HttpAuthenticationChallengeContext context, CancellationToken cancellationToken)
        {
            var userId = context.ActionContext.RequestContext.Principal.Identity.Name;

            context.Result = new SetIdentityResult(userId, context.Result);

            return Task.FromResult(0);
        }

        bool IFilter.AllowMultiple
        {
            get
            {
                return false;
            }
        }

        class SetIdentityResult : IHttpActionResult
        {
            public SetIdentityResult(string userId, IHttpActionResult innerResult)
            {
                UserId = userId;
                InnerResult = innerResult;
            }

            public string UserId { get; private set; }

            public IHttpActionResult InnerResult { get; private set; }

            public async Task<HttpResponseMessage> ExecuteAsync(CancellationToken cancellationToken)
            {
                var response = await InnerResult.ExecuteAsync(cancellationToken);
                var requestUri = response.RequestMessage.RequestUri;

                response.Headers.AddCookies(new CookieHeaderValue[] {
                    new CookieHeaderValue(userIdCookieName, this.UserId) {
                        Domain = requestUri.Host,
                        Path = "/",
                        Expires = DateTimeOffset.Now.AddDays(16),
                        HttpOnly = true,
                    }
                });

                return response;
            }
        }
    }
}