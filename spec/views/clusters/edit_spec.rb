require 'rails_helper'

RSpec.describe "clusters/edit", type: :view do

  let(:cluster) { create(:cluster) }
  before do
    assign(:cluster, cluster)
    params[:name] = cluster.name
    render
  end

  it "renders form with cluster action" do
    expect(rendered).to have_selector("form[action='#{cluster_path(cluster.name)}']")
  end

  it "renders form with post method" do
    expect(rendered).to have_selector("form[method='post']")
  end

  it "renders form with cluster-form directive" do
    expect(rendered).to have_selector("form[cluster-form='#{cluster.id}']")
  end

  it "renders form with cluster-name directive" do
    expect(rendered).to have_selector("form[cluster-name='#{cluster.name}']")
  end

  it "renders \"ready\" button with name='commit'" do
    expect(rendered).to have_selector("input[name='commit']")
  end

  it "renders \"ready\" button with value='Готово'" do
    expect(rendered).to have_selector("input[value='Готово']")
  end

  it "renders \"cancel\" button with name='cancel'" do
    expect(rendered).to have_selector("button[name='cancel']")
  end

  it "renders \"cancel\" button with value='true'" do
    expect(rendered).to have_selector("button[value='true']")
  end

end

RSpec.describe "server_types/edit", type: :feature, js: true do

  let(:admin_user) { create(:admin_user) }
  let(:cluster) { create(:cluster) }
  before do
    login_as admin_user
    visit "clusters/#{cluster.name}/edit"
    sleep 0.1
  end

  context "when click the cancel button" do
    before { click_button "Отмена" }

    it "redirects to index page" do
      expect(current_path).to eq clusters_path
    end
  end

  it "renders the page with necessary count of rows" do
    expect(page).to have_selector(".row", count: cluster.servers.count)
  end

  context "cluster data" do
    let(:current_server_names) { page.all(".row").map{ |row| row.find("select[name$='[server_id]'] option[selected]").text } }
    let(:expected_server_names) { cluster.servers.map(&:name) }

    it "renders a server_parts names" do
      expect(current_server_names).to eq expected_server_names
    end

    let(:current_server_types) { page.all(".row").map{ |row| row.find("select[name$='[node_role_id]'] option[selected]").text } }
    let(:expected_server_types) { cluster.node_roles.map(&:name) }

    it "renders a server_parts count" do
      expect(current_server_types).to eq expected_server_types
    end
  end

  context "when click a plus button" do
    before do
      page.assert_selector("button[ng-click='addClusterPart()']", count: cluster.servers.count)
      page.all("button[ng-click='addClusterPart()']").last.click
    end

    it "adds one more row" do
      expect(page).to have_selector(".row", count: cluster.servers.count + 1)
    end
  end

  context "when click a minus button" do
    before do
      page.assert_selector("button[ng-click='delClusterPart(detail)']", count: cluster.servers.count)
      page.all("button[ng-click='delClusterPart(detail)']").last.click
    end

    it "deletes the row" do
      expect(page).to have_selector(".row", count: cluster.servers.count - 1)
    end
  end

  context "when sends empty data" do
    before do
      fill_in "cluster[name]", with: ""
      click_button "Готово"
    end

    it "renders page with alert" do
      expect(page).to have_selector("div[data-alert]")
    end

    it "renders form with clusters action" do
      expect(page).to have_selector("form[action='#{cluster_path(cluster.name)}']")
    end

    it "renders form with post method" do
      expect(page).to have_selector("form[method='post']")
    end

    it "again renders rows with structure of current cluster" do
      expect(page).to have_selector(".row", count: cluster.servers.count)
    end
  end

end