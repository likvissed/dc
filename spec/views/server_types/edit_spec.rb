require 'rails_helper'

RSpec.describe "server_types/edit", type: :view do

  let(:server_type) { create(:server_type) }
  before do
    assign(:server_type, server_type)
    params[:name] = server_type.name
    render
  end

  it "renders form with server_type action" do
    expect(rendered).to have_selector("form[action='#{server_type_path(server_type.name)}']")
  end

  it "renders form with post method" do
    expect(rendered).to have_selector("form[method='post']")
  end

  it "renders form with serv-type-form directive" do
    expect(rendered).to have_selector("form[serv-type-form='#{server_type.id}']")
  end

  it "renders form with serv-type-name directive" do
    expect(rendered).to have_selector("form[serv-type-name='#{server_type.name}']")
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
  let(:server_type) { create(:server_type) }
  before do
    login_as admin_user
    visit "server_types/#{server_type.name}/edit"
    sleep 0.1
  end

  context "when click the cancel button" do
    before { click_button "Отмена" }

    it "redirects to index page" do
      expect(current_path).to eq server_types_path
    end
  end

  it "renders the page with necessary count of rows" do
    expect(page).to have_selector(".row", count: server_type.server_parts.count)
  end

  context "server_type data" do
    let(:current_server_part_names) { page.all(".row").map{ |row| row.find("select option[selected]").text } }
    let(:expected_server_part_names) { server_type.server_parts.map(&:name) }

    it "renders a server_parts names" do
      expect(current_server_part_names).to eq expected_server_part_names
    end

    let(:current_server_part_counts) { page.all(".row").map{ |row| row.find("input[type='text']")[:value].to_i } }
    let(:expected_server_part_counts) { server_type.template_server_details.map(&:count) }

    it "renders a server_parts count" do
      expect(current_server_part_counts).to eq expected_server_part_counts
    end
  end

  context "when click a plus button" do
    before do
      page.assert_selector("button[ng-click='addServPart()']", count: server_type.server_parts.count)
      page.all("button[ng-click='addServPart()']").last.click
    end

    it "adds one more row" do
      expect(page).to have_selector(".row", count: server_type.server_parts.count + 1)
    end
  end

  context "when click a minus button" do
    before do
      page.assert_selector("button[ng-click='delServPart(detail)']", count: server_type.server_parts.count)
      page.all("button[ng-click='delServPart(detail)']").last.click
    end

    it "deletes the row" do
      expect(page).to have_selector(".row", count: server_type.server_parts.count - 1)
    end
  end

  context "when sends empty data" do
    before do
      fill_in "server_type[name]", with: ""
      click_button "Готово"
    end

    it "renders page with alert" do
      expect(page).to have_selector("div[data-alert]")
    end

    it "renders form with server_types action" do
      expect(page).to have_selector("form[action='#{server_type_path(server_type.name)}']")
    end

    it "renders form with post method" do
      expect(page).to have_selector("form[method='post']")
    end

    it "again renders data about structure of current type" do
      expect(page).to have_selector(".row", count: server_type.server_parts.count)
    end
  end

end